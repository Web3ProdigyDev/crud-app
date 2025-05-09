'use client'

import { getCrudappProgram, getCrudappProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'
import { sign } from 'crypto'

interface CreateEntryArgs {
  title: string;
  message: string;
  owner: PublicKey;
}

export function useCrudappProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getCrudappProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getCrudappProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['crudapp', 'all', { cluster }],
    queryFn: () => program.account.journalEntryState.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const createEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ["JournalEntry", "create", { cluster }],
    mutationFn: async ({ title, message, owner }) => {
      return program.methods.createJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature),
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error creating entry: ${error.message}`);
    } 
  });

  return {
    program,
    accounts,
    getProgramAccount,
    createEntry,
    programId,
  }
}


export function useCrudappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useCrudappProgram()

  const accountQuery = useQuery({
    queryKey: ['crudapp', 'fetch', { cluster, account }],
    queryFn: () => program.account.journalEntryState.fetch(account),
  })

  const updateEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ["JournalEntry", "update", { cluster }],
    mutationFn: async ({ title, message, owner }) => {
      return program.methods.UpdateJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature),
      accounts.refetch();
    },
    onError: (error) => {
      toast.error(`Error updating entry: ${error.message}`);
    } 
  })

  const deleteEntry = useMutation({
    mutationKey: ["JournalEntry", "delete", { cluster }],
    mutationFn: (title: string) => {
      return program.methods.DeleteJournalEntry(title).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature),
      accounts.refetch();
    },
  })

  return {
    accountQuery,
    updateEntry,
    deleteEntry,
  }
}
