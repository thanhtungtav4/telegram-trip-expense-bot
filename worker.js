addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  return new Response('Trip Expense Bot Worker Running!', {
    headers: { 'content-type': 'text/plain' },
  })
}