import urllib.request, json
req = urllib.request.Request('http://127.0.0.1:8000/auth/login', data=b'{\"username\":\"user_test\",\"password\":\"User@123\"}', headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
token = json.loads(res.read())['access_token']
req2 = urllib.request.Request('http://localhost:5026/artist/manager', headers={'Cookie': 'jwt_token=' + token})
try:
    res2 = urllib.request.urlopen(req2)
    print('Success:', res2.status)
    print(res2.read().decode('utf-8')[:100])
except Exception as e:
    print('Failed:', e)
