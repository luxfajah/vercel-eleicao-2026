// Vercel Serverless Function: /api/tse
// Fetches official election data directly from TSE

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Cache at Edge CDN for 4 seconds, allow stale up to 10 seconds
  res.setHeader('Cache-Control', 's-maxage=4, stale-while-revalidate=8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ufs = [
    'ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma',
    'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn',
    'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to', 'br'
  ];

  try {
    const fetchPromises = ufs.map(async (uf) => {
      try {
        const url = `https://resultados.tse.jus.br/oficial/ele2026/6257/dados/${uf}/${uf}-c0001-e006257-u.json`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://resultados.tse.jus.br/'
          }
        });

        if (!response.ok) return null;
        const json = await response.json();

        let flavio = 0, flavioPct = "0,00";
        let lula = 0, lulaPct = "0,00";
        let cury = 0, caiado = 0, renan = 0, zema = 0;

        for (const agr of json.carg?.[0]?.agr || []) {
          for (const par of agr.par || []) {
            for (const cand of par.cand || []) {
              if (cand.n === "22") {
                flavio = Number(cand.vap);
                flavioPct = cand.pvap;
              } else if (cand.n === "13") {
                lula = Number(cand.vap);
                lulaPct = cand.pvap;
              } else if (cand.n === "70") {
                cury = Number(cand.vap);
              } else if (cand.n === "55") {
                caiado = Number(cand.vap);
              } else if (cand.n === "14") {
                renan = Number(cand.vap);
              } else if (cand.n === "30") {
                zema = Number(cand.vap);
              }
            }
          }
        }

        return [uf.toUpperCase(), {
          uf: uf.toUpperCase(),
          ts: Number(json.s?.ts || 0),
          st: Number(json.s?.st || 0),
          pst: json.s?.pst || "0,00",
          tv: Number(json.v?.tv || 0),
          vv: Number(json.v?.vv || 0),
          flavio,
          flavioPct,
          lula,
          lulaPct,
          cury,
          caiado,
          renan,
          zema,
          ht: json.ht || ""
        }];
      } catch (err) {
        return null;
      }
    });

    const entries = await Promise.all(fetchPromises);
    const data = Object.fromEntries(entries.filter(Boolean));

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
