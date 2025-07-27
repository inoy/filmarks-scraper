const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function fetchPage(pageNum) {
  const url = `https://filmarks.com/list-anime/tag/%E7%A5%9E%E3%82%A2%E3%83%8B%E3%83%A1?page=${pageNum}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.9'
      },
      timeout: 10000
    });
    return response.data;
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
    
    // Make sure URL is complete
    if (url && !url.startsWith('http')) {
      // Remove query parameters for cleaner URLs
      url = url.split('?')[0];
      url = `https://filmarks.com${url}`;
    }
    
    // Only add if we have all required data and rating is >= 4.3
    if (title && rating >= 4.3 && url && !processedUrls.has(url)) {
      processedUrls.add(url);
      animeList.push({ title, rating, url });
    }
  });
  
  return animeList;
}

async function scrapeAllPages() {
  const allAnime = [];
  const processedUrls = new Set();
  const startPage = parseInt(process.argv[2]) || 1;
  const endPage = parseInt(process.argv[3]) || 10;
  
  console.log('🎬 Starting Filmarks anime scraper...');
  console.log('📊 Looking for anime with ratings >= 4.3');
  console.log(`📄 Pages ${startPage} to ${endPage}\n`);
  
  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    console.log(`\n📄 Fetching page ${pageNum}...`);
    const html = await fetchPage(pageNum);
    
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
    
    console.log(`✅ Found ${newAnime.length} new anime with rating >= 4.3`);
    console.log(`📈 Total so far: ${allAnime.length}`);
    
    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 FINAL RESULTS: ${allAnime.length} anime with rating >= 4.3`);
  console.log('='.repeat(60) + '\n');
  
  // Sort by rating descending
  allAnime.sort((a, b) => b.rating - a.rating);
  
  // Display results
  if (allAnime.length > 0) {
    console.log('Top rated anime:\n');
    allAnime.forEach((anime, index) => {
      console.log(`${index + 1}. ${anime.title} (★${anime.rating})`);
      console.log(`   ${anime.url}\n`);
    });
    
    // Save to files
    const urlList = allAnime.map(a => a.url).join('\n');
    fs.writeFileSync('high-rated-anime-urls.txt', urlList, 'utf8');
    
    const detailedList = allAnime.map((a, i) => 
      `${i + 1}. ${a.title} (★${a.rating})\n${a.url}`
    ).join('\n\n');
    fs.writeFileSync('high-rated-anime-detailed.txt', detailedList, 'utf8');
    
    console.log('\n📁 Results saved to:');
    console.log('- high-rated-anime-urls.txt (URLs only)');
    console.log('- high-rated-anime-detailed.txt (with titles and ratings)');
  } else {
    console.log('No anime found with rating >= 4.3');
  }
  
  return allAnime;
}

// Run the scraper
scrapeAllPages().catch(console.error);