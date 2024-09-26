import Transport from "@ledgerhq/hw-transport";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import Eth from "@ledgerhq/hw-app-eth";
import { ethers } from "ethers";

export async function createTransport(): Promise<Transport> {
    return TransportWebUSB.create();
}

export async function getAddress(transport: Transport, path: string): Promise<string> {
    const eth = new Eth(transport);
    const address = await eth.getAddress(path);
    return address.address;
}

function waiter(duration: number): Promise<void> {
   return new Promise((resolve) => {
       setTimeout(resolve, duration);
   });
}

export class LedgerSigner extends ethers.Signer {
    readonly path: string
    readonly _eth: Promise<Eth>;

    constructor(transport: Transport, provider?: ethers.providers.Provider, path?: string) {
        super();

        ethers.utils.defineReadOnly(this, "path", path || "44'/304'/0'/0/0");
        ethers.utils.defineReadOnly(this, "provider", provider || null);

        const eth = new Eth(transport);
        const _eth = eth.getAppConfiguration().then((config) => {
            return eth;
        }, (error) => {
            return Promise.reject(error);
        });
        ethers.utils.defineReadOnly(this, "_eth", _eth);
    }

    _retry<T = any>(callback: (eth: Eth) => Promise<T>, timeout?: number): Promise<T> {
        return new Promise(async (resolve, reject) => {
            if (timeout && timeout > 0) {
                setTimeout(() => { reject(new Error("timeout")); }, timeout);
            }

            const eth = await this._eth;

            // Wait up to 5 seconds
            for (let i = 0; i < 50; i++) {
                try {
                    const result = await callback(eth);
                    return resolve(result);
                } catch (error) {
                    if (error.id !== "TransportLocked") {
                        return reject(error);
                    }
                }
                await waiter(100);
            }

            return reject(new Error("timeout"));
        });
    }

    async getAddress(): Promise<string> {
        const account = await this._retry((eth) => eth.getAddress(this.path));
        return ethers.utils.getAddress(account.address);
    }

    async signMessage(message: ethers.utils.Bytes | string): Promise<string> {
        if (typeof(message) === 'string') {
            message = ethers.utils.toUtf8Bytes(message);
        }

        const messageHex = ethers.utils.hexlify(message).substring(2);

        const sig = await this._retry((eth) => eth.signPersonalMessage(this.path, messageHex));
        sig.r = '0x' + sig.r;
        sig.s = '0x' + sig.s;
        return ethers.utils.joinSignature(sig);
    }

    async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
        const tx = await ethers.utils.resolveProperties(transaction);
        const baseTx: ethers.utils.UnsignedTransaction = {
            chainId: (tx.chainId || undefined),
            data: (tx.data || undefined),
            gasLimit: (tx.gasLimit || undefined),
            gasPrice: (tx.gasPrice || undefined),
            nonce: (tx.nonce ? ethers.BigNumber.from(tx.nonce).toNumber(): undefined),
            to: (tx.to || undefined),
            value: (tx.value || undefined),
        };

        const unsignedTx = ethers.utils.serializeTransaction(baseTx).substring(2);
        const sig = await this._retry((eth) => eth.signTransaction(this.path, unsignedTx));

        return ethers.utils.serializeTransaction(baseTx, {
            v: ethers.BigNumber.from("0x" + sig.v).toNumber(),
            r: ("0x" + sig.r),
            s: ("0x" + sig.s),
        });
    }

    connect(provider: ethers.providers.Provider): ethers.Signer {
        return new LedgerSigner(provider, this.path);
    }
}

