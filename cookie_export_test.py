import tempfile, sys, os
try:
    import browser_cookie3
except Exception as e:
    print('ERR_IMPORT', e)
    sys.exit(2)
try:
    cj = None
    try:
        cj = browser_cookie3.chrome()
    except Exception as e:
        print('WARN_LOAD', e)
        try:
            cj = browser_cookie3.load()
        except Exception as e2:
            print('ERR_LOAD_ALL', e2)
            sys.exit(3)
    tf = tempfile.NamedTemporaryFile(delete=False, suffix='.txt')
    path = tf.name
    tf.close()
    with open(path,'w',encoding='utf-8') as fh:
        fh.write('# Netscape HTTP Cookie File\n')
        count = 0
        for c in cj:
            domain = c.domain
            flag = 'TRUE' if domain.startswith('.') else 'FALSE'
            pathc = c.path
            secure = 'TRUE' if c.secure else 'FALSE'
            expires = str(int(c.expires)) if getattr(c,'expires',None) else '0'
            name = c.name
            value = c.value
            fh.write(f"{domain}\t{flag}\t{pathc}\t{secure}\t{expires}\t{name}\t{value}\n")
            count += 1
            if count>=5:
                break
    print('OK', path, 'wrote', count, 'cookies (first 5)')
    with open(path,'r',encoding='utf-8') as fh:
        for i,line in enumerate(fh):
            if i>6: break
            print('LINE', i, line.strip())
    try:
        os.unlink(path)
        print('CLEANED')
    except Exception as e:
        print('CLEAN_FAIL', e)
except Exception as e:
    print('ERR', e)
    sys.exit(1)
