import Verifier from "./Verifier";
import { bech32 } from 'bech32';

const BITCOIN_WITNESS_VERSION_SEPARATOR_BYTE = 0;

function makeBech32Encoder(prefix: string) {
  return (data: Buffer) => {
    const words = bech32.toWords(data)
    const wordsToEncode = prefix == 'bc' ? [BITCOIN_WITNESS_VERSION_SEPARATOR_BYTE, ...words] : words;
    const encodedAddress = bech32.encode(prefix, wordsToEncode)

    return encodedAddress
  }
}

function makeBech32Decoder(currentPrefix: string) {
  return (data: string) => {
    const { prefix, words } = bech32.decode(data)
    if (prefix !== currentPrefix) {
      throw Error('Unrecognised address format')
    }
    if (prefix == 'bc') {
      //remove witness version separator byte
      words.shift();
    }

    return Buffer.from(bech32.fromWords(words))
  }
}

const bech32Chain = (name: string, prefix: string) => ({
  decoder: makeBech32Decoder(prefix),
  encoder: makeBech32Encoder(prefix),
  name,
})

const COSMOS = bech32Chain('COSMOS', 'cosmos')
const BTC = bech32Chain('BTC', 'bc')

//Converts a cosmos address to its corresponding btc address (bech32)
export const cosmosToBtc = (cosmosAddress: string) => {
  const data = COSMOS.decoder(cosmosAddress)
  return BTC.encoder(data)
}

//Replace escaped quotes with regular quotes
const message = process.argv[2].replace(/\\\"/g, "\"");
const signature = process.argv[3];
//Convert cosmos address to btc address
const address = cosmosToBtc(process.argv[4]);
//Convert from hex to base64
const base64Signature = Buffer.from(signature, 'hex').toString('base64');
const verified = Verifier.verifySignature(address, message, base64Signature);

//simply print this out for the chain to parse
console.log(verified);