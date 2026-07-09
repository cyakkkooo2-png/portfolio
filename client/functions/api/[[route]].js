export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const target = 'https://portfolio-production-913f.up.railway.app' + url.pathname + url.search;

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-For', request.headers.get('cf-connecting-ip') || '');

  const res = await fetch(target, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    redirect: 'follow',
  });

  const rh = new Headers(res.headers);
  rh.set('Access-Control-Allow-Origin', '*');
  rh.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  rh.set('Access-Control-Allow-Headers', '*');

  return new Response(res.body, { status: res.status, headers: rh });
}
