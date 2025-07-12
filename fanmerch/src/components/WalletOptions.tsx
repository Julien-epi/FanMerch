import { useConnect } from 'wagmi'

export function WalletOptions() {
  const { connectors, connect, isPending } = useConnect()

  return (
    <div className="relative">
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 border border-red-500 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600 flex items-center space-x-2 shadow-lg"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2h12z" />
        </svg>
        <span>{isPending ? 'Connexion...' : 'Connecter Wallet'}</span>
      </button>
    </div>
  )
} 