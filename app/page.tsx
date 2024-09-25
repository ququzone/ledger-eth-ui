"use client";

import { useState } from "react";
import { Card } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Spacer } from "@nextui-org/spacer";
import { createTransport, getAddress, LedgerSigner } from "@/components/ledger";
import { ethers } from "ethers";

export default function Home() {
  const [address, setAddress] = useState("");

  async function fetchAddress(event: SubmitEvent) {
    event.preventDefault();
    // @ts-ignore
    const formData = new FormData(event.currentTarget);
    const transport = await createTransport();
    setAddress(await getAddress(transport, formData.get('path')!.toString()));
    await transport.close();
  }

  async function bucketDeposit() {
    const provider = new ethers.providers.JsonRpcProvider("https://babel-api.mainnet.iotex.io")
    const signer = new LedgerSigner(provider, "44'/304'/0'/0/0")

    const staking = new ethers.Contract(
        "0x04c22afae6a03438b8fed74cb1cf441168df3f12",
        `[{
          "inputs": [
            {
              "internalType": "uint64",
              "name": "bucketIndex",
              "type": "uint64"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "uint8[]",
              "name": "data",
              "type": "uint8[]"
            }
          ],
          "name": "depositToStake",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        }]`,
        signer
    )

    const index = 56342
    const tx = await staking.depositToStake(
        index,
        ethers.utils.parseEther("1.0"),
        []
    )
    const receipt = await tx.wait()
    if (receipt.status !== 1) {
        console.log(`deposit bucket fail`)
        return
    }
    console.log(`deposit bucket #${index} with tx ${tx.hash}`)
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="mt-8">
        <Card className="w-[500px] space-y-5 p-4">
          <form className="h-50 rounded-lg bg-default-200 space-y-5 md:p-2" onSubmit={fetchAddress}>
            <Input id="path" name="path" type="text" label="Path" defaultValue="44'/304'/0'/0/0" />
            <Button color="primary" type="submit">
              Get Address
            </Button>
            <Spacer />
            <Button color="primary" onPress={bucketDeposit}>
              Add bucket
            </Button>
            <div>
                {address}
            </div>
          </form>
          <div className="space-y-3">
            <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
            <div className="h-3 w-4/5 rounded-lg bg-default-200"></div>
            <div className="h-3 w-2/5 rounded-lg bg-default-300"></div>
          </div>
        </Card>
      </div>
    </section>
  );
}
