'use client';

import { FormEvent, useState } from "react";
import { createTransport, getAddress } from "./ledger/app";

export default function Home() {
  const [address, setAddress] = useState("");

  async function fetchAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const transport = await createTransport();
    setAddress(await getAddress(transport, formData.get('path')!.toString()));
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <form onSubmit={fetchAddress}>
          <div className="space-y-6">
            <div className="border-b border-gray-900/10 pb-12">
              <h2 className="text-base font-semibold leading-7 text-gray-900">Testing Ledger Address</h2>
            </div>

            <div>
              <label htmlFor="path" className="block text-sm font-medium leading-6 text-gray-900">Path</label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <input type="text" name="path" id="path" className="block w-full rounded-md border-0 py-1.5 pl-3 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" defaultValue="44'/60'/0'/0/0" />
              </div>
            </div>

            <div>
              <label htmlFor="path" className="block text-sm font-medium leading-6 text-gray-900">Address</label>
              <div className="relative mt-2 rounded-md shadow-sm">
                {address}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button type="button" className="text-sm font-semibold leading-6 text-gray-900">Cancel</button>
            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Get address</button>
          </div>
        </form>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}
