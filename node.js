import { createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { mplex } from '@libp2p/mplex';
import { noise } from '@libp2p/noise';
import { multiaddr } from '@multiformats/multiaddr';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

async function createHost(port) {
  const node = await createLibp2p({
    addresses: {
      listen: [`/ip4/127.0.0.1/tcp/${port}`]
    },
    transports: [tcp()],
    streamMuxers: [mplex()],
    connectionEncryption: [noise()],
    connectionManager: {
      autoDial: true
    }
  });

  await node.start();
  
  console.log('Hello, my Peer ID is:', node.peerId.toString());
  console.log('Listening on:', node.getMultiaddrs().map(addr => addr.toString()));
  
  const connectionString = `/ip4/127.0.0.1/tcp/${port}/p2p/${node.peerId.toString()}`;
  console.log('Connection string:', connectionString);
  
  return { node, connectionString };
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('peer-address', {
      type: 'string',
      default: '',
      describe: 'Peer address to connect to'
    })
    .option('port', {
      type: 'string',
      default: '9000',
      describe: 'Port to listen on'
    })
    .help()
    .argv;

  try {
    const { node, connectionString } = await createHost(argv.port);

    // Connect to peer if address provided
    if (argv['peer-address']) {
      try {
        const peerAddr = multiaddr(argv['peer-address']);
        const peerId = peerAddr.getPeerId();
        
        await node.dial(peerAddr);
        console.log('Connected to:', peerId);
      } catch (err) {
        console.error('Failed to connect to peer:', err);
      }
    }

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await node.stop();
      process.exit(0);
    });

    console.log('Node is running. Press Ctrl+C to exit.');

  } catch (err) {
    console.error('Error starting node:', err);
    process.exit(1);
  }
}

// Check if this is the main module (ES module equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}