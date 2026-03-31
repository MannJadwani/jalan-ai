# Debug: Webhook Request & Response

## Webhook URL
```
POST http://117.250.36.98:5678/webhook/e5500488-4a22-47f7-abb7-0d2aba7f5f78
```

## Request Sent
```http
POST /webhook/e5500488-4a22-47f7-abb7-0d2aba7f5f78 HTTP/1.1
Host: 117.250.36.98:5678
Content-Type: application/json

{"message": "Show me top 10 selling products this month"}
```

## Raw Response
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Vary: Accept-Encoding
Transfer-Encoding: chunked

(empty body — chunked response with 0-length chunk)
```

### Raw bytes of response body:
```
00000000: 30 0d 0a 0d 0a    ("0\r\n\r\n")
```
This is the chunked transfer encoding terminator — meaning the server returned **zero bytes of actual content**.

## Response Time
~22-27 seconds (the n8n workflow runs but returns nothing)

## Multiple Payload Formats Tested
All returned the same empty body:
- `{"message": "..."}` — empty
- `{"chatInput": "..."}` — empty
- `{"query": "..."}` — empty
- `{"input": "..."}` — empty
- `Content-Type: text/plain` — empty

## Why the Frontend Shows "Couldn't connect to the server"

The `fetch()` call in the chat page does:
```js
const data = await response.json();
```

Since the response body is **empty**, `response.json()` throws a `SyntaxError: Unexpected end of JSON input`, which gets caught by the `catch` block and shows the generic error message.
