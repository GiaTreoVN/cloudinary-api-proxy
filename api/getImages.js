// vercel/api/getImages.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { cloudName, folderPath } = req.query;

  if (!cloudName || !folderPath) {
    return res.status(400).json({ error: 'Missing cloudName or folderPath' });
  }

  try {
    // Lấy API Key và Secret từ environment variables
    // Bạn cần set ở Vercel Dashboard → Settings → Environment Variables
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ 
        error: 'API credentials not configured. Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Vercel environment variables.' 
      });
    }

    // Tạo Basic Auth header
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    // Gọi Cloudinary API
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expression: `folder="${folderPath}" AND resource_type="image"`,
          max_results: 500,
          sort_by: [['public_id', 'asc']]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'Failed to fetch images from Cloudinary' 
      });
    }

    // Return danh sách URL
    const urls = (data.resources || []).map(r => r.secure_url);
    res.status(200).json({ 
      success: true, 
      count: urls.length,
      urls: urls,
      csv: urls.join(',')
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
