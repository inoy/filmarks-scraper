const cheerio = require('cheerio');
const fs = require('fs');

// Load configuration
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

async function fetchPage(pageNum, tag) {
  const encodedTag = encodeURIComponent(tag);
  const url = `https://filmarks.com/list-anime/tag/${encodedTag}?page=${pageNum}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching page ${pageNum}:`, error.message);
    return null;
  }
}


function extractAnimeData(html) {
  const $ = cheerio.load(html);
  const animeList = [];
  const processedUrls = new Set();

  // Find all content cassettes
  $('.p-content-cassette').each((i, elem) => {
    const $cassette = $(elem);

    // Get title
    const title = $cassette.find('.p-content-cassette__title').first().text().trim();

    // Get the main anime rating (not review ratings)
    const $mainRating = $cassette.find('.p-content-cassette__rate .c-rating__score').first();
    const rating = parseFloat($mainRating.text().trim());

    // Get URL - look for the main anime link
    let url = null;
    const $titleLink = $cassette.find('.p-content-cassette__title-wrapper a').first();
    if ($titleLink.length) {
      url = $titleLink.attr('href');
    } else {
      // Try to find any anime link in the cassette
      const $anyLink = $cassette.find('a[href*="/animes/"]').first();
      if ($anyLink.length) {
        url = $anyLink.attr('href');
      }
    }
    
    // Get release date from the list page
    let releaseDate = 'N/A';
    const $releaseDate = $cassette.find('.p-content-cassette__other-info-title').filter((i, elem) => {
      return $(elem).text().includes('公開日：');
    }).next('span');
    
    if ($releaseDate.length && $releaseDate.text().trim()) {
      releaseDate = $releaseDate.text().trim();
    }
    
    // Get mark count (視聴済み数) and clip count (観たい数)
    let markCount = 0;
    let clipCount = 0;
    
    const parentCassette = $cassette.closest('.js-cassette');
    if (parentCassette.length) {
      // Extract mark count from data-mark attribute
      const markData = parentCassette.attr('data-mark');
      if (markData) {
        try {
          const markObj = JSON.parse(markData.replace(/&quot;/g, '"'));
          markCount = parseInt(markObj.count) || 0;
        } catch (e) {
          // If parsing fails, keep markCount as 0
        }
      }
      
      // Extract clip count from data-clip attribute
      const clipData = parentCassette.attr('data-clip');
      if (clipData) {
        try {
          const clipObj = JSON.parse(clipData.replace(/&quot;/g, '"'));
          clipCount = parseInt(clipObj.count) || 0;
        } catch (e) {
          // If parsing fails, keep clipCount as 0
        }
      }
    }

    // Make sure URL is complete
    if (url && !url.startsWith('http')) {
      // Remove query parameters for cleaner URLs
      url = url.split('?')[0];
      url = `https://filmarks.com${url}`;
    }

    // Only add if we have all required data and rating is >= minRating
    if (title && rating >= config.minRating && url && !processedUrls.has(url)) {
      processedUrls.add(url);
      animeList.push({ title, rating, url, releaseDate, markCount, clipCount });
    }
  });

  return animeList;
}

async function scrapeAllPages() {
  const allAnime = [];
  const processedUrls = new Set();
  const { tag, startPage, endPage, minRating, requestDelay } = config;

  console.log('🎬 Starting Filmarks anime scraper...');
  console.log(`🏷️  Tag: ${tag}`);
  console.log(`📊 Looking for anime with ratings >= ${minRating}`);
  console.log(`📄 Pages ${startPage} to ${endPage}\n`);

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    console.log(`\n📄 Fetching page ${pageNum}...`);
    const html = await fetchPage(pageNum, tag);

    if (!html) {
      console.log('❌ Failed to fetch page.');
      continue;
    }

    // Check if we're on a valid page with anime content
    if (!html.includes('p-content-cassette')) {
      console.log('⚠️  No anime content found on this page.');
      break;
    }

    const animeData = extractAnimeData(html);

    // Filter out duplicates
    const newAnime = animeData.filter(anime => !processedUrls.has(anime.url));
    newAnime.forEach(anime => processedUrls.add(anime.url));

    allAnime.push(...newAnime);

    console.log(`✅ Found ${newAnime.length} new anime with rating >= ${config.minRating}`);
    console.log(`📈 Total so far: ${allAnime.length}`);

    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, config.requestDelay));
  }

  // Release dates are now fetched from the list page, no need for additional requests
  
  // Calculate total score for each anime
  console.log(`\n📊 Calculating comprehensive scores...`);
  
  // Find max values for normalization
  const maxMarkCount = Math.max(...allAnime.map(a => a.markCount));
  const maxClipCount = Math.max(...allAnime.map(a => a.clipCount));
  
  allAnime.forEach(anime => {
    // Normalize counts to 0-5 scale to match rating scale
    const normalizedMarkCount = maxMarkCount > 0 ? (anime.markCount / maxMarkCount) * 5 : 0;
    const normalizedClipCount = maxClipCount > 0 ? (anime.clipCount / maxClipCount) * 5 : 0;
    
    // Calculate total score: rating(60%) + markCount(30%) + clipCount(10%)
    anime.totalScore = (anime.rating * 0.6) + (normalizedMarkCount * 0.3) + (normalizedClipCount * 0.1);
    
    // Round to 2 decimal places
    anime.totalScore = Math.round(anime.totalScore * 100) / 100;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 FINAL RESULTS: ${allAnime.length} anime with rating >= ${config.minRating}`);
  console.log('='.repeat(60) + '\n');

  // Sort by total score descending
  allAnime.sort((a, b) => b.totalScore - a.totalScore);

  // Display results
  if (allAnime.length > 0) {
    console.log('Top anime by comprehensive score:\n');
    allAnime.forEach((anime, index) => {
      console.log(`${index + 1}. ${anime.title}`);
      console.log(`   Score: ${anime.totalScore} (Rating: ★${anime.rating}, Views: ${anime.markCount.toLocaleString()}, Watchlist: ${anime.clipCount.toLocaleString()})`);
      console.log(`   Release: ${anime.releaseDate}`);
      console.log(`   ${anime.url}\n`);
    });

    // Save to files
    const urlList = allAnime.map(a => a.url).join('\n');
    fs.writeFileSync('high-rated-anime-urls.txt', urlList, 'utf8');

    const detailedList = allAnime.map((a, i) =>
      `${i + 1}. ${a.title}\nScore: ${a.totalScore} (Rating: ★${a.rating}, Views: ${a.markCount.toLocaleString()}, Watchlist: ${a.clipCount.toLocaleString()})\nRelease: ${a.releaseDate}\n${a.url}`
    ).join('\n\n');
    fs.writeFileSync('high-rated-anime-detailed.txt', detailedList, 'utf8');

    console.log('\n📁 Results saved to:');
    console.log('- high-rated-anime-urls.txt (URLs only)');
    console.log('- high-rated-anime-detailed.txt (with comprehensive scores and details)');
  } else {
    console.log(`No anime found with rating >= ${config.minRating}`);
  }

  return allAnime;
}

// Run the scraper
scrapeAllPages().catch(console.error);
