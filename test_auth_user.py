import urllib.request, json
req = urllib.request.Request('http://127.0.0.1:8000/auth/login', data=b'{\"username\":\"user_test\",\"password\":\"User@123\",\"role\":\"user\"}', headers={'Content-Type': 'application/json'})
try:
    res = urllib.request.urlopen(req)
    print('Success:', json.loads(res.read())['role'])
except Exception as e:
    print('Failed:', e)
