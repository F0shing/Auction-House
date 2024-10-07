const API_KEY = 'bf6995d9-6236-4ddb-8874-dbcc514c64c2';
const BASE_URL = 'https://api.hypixel.net/skyblock/auctions';
let currentPage = 1;
const cardsPerPage = 24;
let cards = [];
let totalPages = 0;

async function fetchAuctions(page = 0, filter = 'all', searchQuery = '') {
  const response = await fetch(`${BASE_URL}?key=${API_KEY}&page=${page}`);
  if (response.ok) {
    const data = await response.json();
    let auctions = data.auctions;
    if (filter === 'bin') {
      auctions = auctions.filter(auction => auction.bin);
    } else if (filter === 'auction') {
      auctions = auctions.filter(auction => !auction.bin);
    }
    if (searchQuery) {
      auctions = auctions.filter(auction => auction.item_name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return { ...data, auctions };
  } else if (response.status === 404) {
    console.error(`Page ${page} not found: ${response.status}`);
    return null;
  } else {
    console.error(`Failed to fetch data: ${response.status}`);
    return null;
  }
}

async function updateAuctionData() {
  const filter = document.getElementById('filter').value;
  const searchQuery = document.getElementById('search').value;
  let page = 0;
  let auctionData = [];
  while (true) {
    const data = await fetchAuctions(page, filter, searchQuery);
    if (!data || !data.success || !data.auctions.length) break;

    auctionData = auctionData.concat(data.auctions.map(auction => ({
      item_name: auction.item_name,
      item_lore: formatLore(auction.item_lore || 'No lore available'),
      start: new Date(auction.start).toISOString(),
      end: new Date(auction.end).toISOString(),
      price: auction.starting_bid,
      auction_id: auction.uuid,
      bin: auction.bin ? 'BIN Only' : 'Auction'
    })));

    page++;
  }
  cards = auctionData;
  totalPages = Math.ceil(cards.length / cardsPerPage);
  renderCards();
  updatePageInfo();
}

function formatLore(lore) {
  const colorMap = {
    '0': 'black',
    '1': 'dark_blue',
    '2': 'dark_green',
    '3': 'dark_aqua',
    '4': 'dark_red',
    '5': 'dark_purple',
    '6': 'gold',
    '7': 'gray',
    '8': 'dark_gray',
    '9': 'blue',
    'a': 'green',
    'b': 'aqua',
    'c': 'red',
    'd': 'light_purple',
    'e': 'yellow',
    'f': 'white',
    'k': 'obfuscated',
    'l': 'bold',
    'm': 'strikethrough',
    'n': 'underline',
    'o': 'italic',
    'r': 'reset'
  };

  return lore.replace(/\u00a7([0-9a-fk-or])/g, (match, p1) => {
    const colorClass = colorMap[p1];
    return `</span><span class="${colorClass}">`;
  }).replace(/\n/g, '<br>').replace(/^/, '<span class="reset">').concat('</span>');
}

function renderCards() {
  const cardContainer = document.getElementById('card-container');
  cardContainer.innerHTML = ''; // Clear previous cards

  cards.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage).forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.auctionId = card.auction_id;
    cardElement.innerHTML = `
      <div class="title">${card.item_name}</div>
      <div class="stat">${card.item_lore}</div>
      <div class="footnote">Start: ${new Date(card.start).toLocaleString()}</div>
      <div class="footnote">End: ${new Date(card.end).toLocaleString()}</div>
      <div class="requirement">Price: ${card.price.toLocaleString()}</div>
      <div class="type">${card.bin}</div>
    `;
    cardContainer.appendChild(cardElement);

    // Add click event listener to copy auction_id to clipboard
    cardElement.addEventListener('click', () => {
      copyToClipboard(`/viewauction ${card.auction_id}`);
    });
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Auction ID copied to clipboard:', text);
  }).catch(err => {
    console.error('Failed to copy text to clipboard:', err);
  });
}

function handlePagination() {
  const prevButtons = document.querySelectorAll('#prev');
  const nextButtons = document.querySelectorAll('#next');

  prevButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCards();
        updatePageInfo();
      }
    });
  });

  nextButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderCards();
        updatePageInfo();
      }
    });
  });
}

function updatePageInfo() {
  document.querySelectorAll('.page-info').forEach(span => {
    span.textContent = `Page ${currentPage} of ${totalPages}`;
  });
}

document.getElementById('filter').addEventListener('change', () => {
  currentPage = 1;
  updateAuctionData();
});

document.getElementById('search-btn').addEventListener('click', () => {
  currentPage = 1;
  updateAuctionData();
});

updateAuctionData();
handlePagination();
setInterval(updateAuctionData, 60000); // Update every 60 seconds