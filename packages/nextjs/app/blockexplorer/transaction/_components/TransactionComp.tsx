"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, Transaction, TransactionReceipt, formatEther, formatUnits } from "viem";
import { hardhat } from "viem/chains";
import { usePublicClient } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { decodeTransactionData, getFunctionDetails } from "~~/utils/scaffold-eth";
import { replacer } from "~~/utils/scaffold-eth/common";

const TransactionComp = ({ txHash }: { txHash: Hash }) => {
  const client = usePublicClient({ chainId: hardhat.id });
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction>();
  const [receipt, setReceipt] = useState<TransactionReceipt>();
  const [functionCalled, setFunctionCalled] = useState<string>();

  const { targetNetwork } = useTargetNetwork();

  useEffect(() => {
    if (txHash && client) {
      const fetchTransaction = async () => {
        const tx = await client.getTransaction({ hash: txHash });
        const receipt = await client.getTransactionReceipt({ hash: txHash });

        const transactionWithDecodedData = decodeTransactionData(tx);
        setTransaction(transactionWithDecodedData);
        setReceipt(receipt);

        const functionCalled = transactionWithDecodedData.input.substring(0, 10);
        setFunctionCalled(functionCalled);
      };

      fetchTransaction();
    }
  }, [client, txHash]);

  return (
    <div className="container mx-auto mt-10 mb-20 px-10 md:px-0">
      <Button size="sm" onClick={() => router.back()}>
        Back
      </Button>
      {transaction ? (
        <div className="overflow-x-auto">
          <h2 className="text-3xl font-bold mb-4 text-center text-foreground">Transaction Details</h2>{" "}
          <table className="w-full table-auto rounded-lg bg-card text-card-foreground shadow-lg">
            <tbody>
              <tr>
                <td>
                  <strong>Transaction Hash:</strong>
                </td>
                <td>{transaction.hash}</td>
              </tr>
              <tr>
                <td>
                  <strong>Block Number:</strong>
                </td>
                <td>{Number(transaction.blockNumber)}</td>
              </tr>
              <tr>
                <td>
                  <strong>From:</strong>
                </td>
                <td>
                  <Address address={transaction.from} format="long" onlyEnsOrAddress />
                </td>
              </tr>
              <tr>
                <td>
                  <strong>To:</strong>
                </td>
                <td>
                  {!receipt?.contractAddress ? (
                    transaction.to && <Address address={transaction.to} format="long" onlyEnsOrAddress />
                  ) : (
                    <span>
                      Contract Creation:
                      <Address address={receipt.contractAddress} format="long" onlyEnsOrAddress />
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Value:</strong>
                </td>
                <td>
                  {formatEther(transaction.value)} {targetNetwork.nativeCurrency.symbol}
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Function called:</strong>
                </td>
                <td>
                  <div className="w-full md:max-w-[600px] lg:max-w-[800px] overflow-x-auto whitespace-nowrap">
                    {functionCalled === "0x" ? (
                      "This transaction did not call any function."
                    ) : (
                      <>
                        <span className="mr-2">{getFunctionDetails(transaction)}</span>
                        <Badge variant="primary">{functionCalled}</Badge>
                      </>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Gas Price:</strong>
                </td>
                <td>{formatUnits(transaction.gasPrice || 0n, 9)} Gwei</td>
              </tr>
              <tr>
                <td>
                  <strong>Data:</strong>
                </td>
                <td className="form-control">
                  <textarea
                    readOnly
                    value={transaction.input}
                    className="p-0 w-full h-[150px] bg-transparent border rounded-md px-2 py-1"
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Logs:</strong>
                </td>
                <td>
                  <ul>
                    {receipt?.logs?.map((log, i) => (
                      <li key={i}>
                        <strong>Log {i} topics:</strong> {JSON.stringify(log.topics, replacer, 2)}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-2xl text-foreground">Loading...</p>
      )}
    </div>
  );
};

export default TransactionComp;
