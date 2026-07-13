import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Define symbols we want to fetch (luxury/executive focus)
  // Let's fetch some top stocks and forex pairs
  const symbols = ['AAPL', 'TSLA', 'SPY']; // Finnhub free tier usually requires separate calls per symbol
  // Actually, Finnhub free tier limits to 60 calls/minute. Let's just do a few.
  // Wait, Finnhub /quote endpoint is for stocks. For forex, the symbol format is 'OANDA:EUR_USD' or 'BINANCE:BTCUSDT'.
  // We'll fetch 3 key indicators to keep it simple and within rate limits.

  try {
    const results = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`).then(res => res.json()).then(data => ({ symbol: 'AAPL', price: data.c, change: data.dp })),
      fetch(`https://finnhub.io/api/v1/quote?symbol=TSLA&token=${apiKey}`).then(res => res.json()).then(data => ({ symbol: 'TSLA', price: data.c, change: data.dp })),
      // Let's try getting some general market news instead if quotes are limited, but quotes are fine.
      fetch(`https://finnhub.io/api/v1/quote?symbol=SPY&token=${apiKey}`).then(res => res.json()).then(data => ({ symbol: 'SPY', price: data.c, change: data.dp }))
    ]);

    // Let's also fetch general news
    const newsRes = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${apiKey}`);
    const newsData = await newsRes.json();
    const topNews = newsData.slice(0, 3).map((n: any) => n.headline);

    return NextResponse.json({ quotes: results, news: topNews });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
