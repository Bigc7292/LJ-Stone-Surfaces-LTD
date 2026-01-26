import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const lookup = promisify(dns.lookup);

const hostname = 'db.tdjyjaemqjhbovsqaoyv.supabase.co';

(async () => {
    console.log(`Resolving ${hostname}...`);

    try {
        const addresses4 = await resolve4(hostname).catch(e => e.message);
        console.log('IPv4 (dns.resolve4):', addresses4);
    } catch (e) { console.error('IPv4 Error:', e); }

    try {
        const addresses6 = await resolve6(hostname).catch(e => e.message);
        console.log('IPv6 (dns.resolve6):', addresses6);
    } catch (e) { console.error('IPv6 Error:', e); }

    try {
        const result = await lookup(hostname, { all: true });
        console.log('dns.lookup (OS):', result);
    } catch (e) { console.error('Lookup Error:', e); }
})();
