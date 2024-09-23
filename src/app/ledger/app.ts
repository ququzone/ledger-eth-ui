import Transport from "@ledgerhq/hw-transport";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb";
import Eth from "@ledgerhq/hw-app-eth";

export async function createTransport(): Promise<Transport> {
    return TransportWebUSB.create();
}

export async function getAddress(transport: Transport, path: string): Promise<string> {
    const eth = new Eth(transport);
    const address = await eth.getAddress(path);
    return address.address;
}
