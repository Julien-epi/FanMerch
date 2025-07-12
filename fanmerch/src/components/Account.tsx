import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi'

export function Account() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!address) return null

  return (
    <div className="flex items-center space-x-3">
      {ensAvatar && (
        <img 
          alt="ENS Avatar" 
          src={ensAvatar} 
          className="w-8 h-8 rounded-full"
        />
      )}
      <span className="text-sm text-gray-600">
        {ensName ? `${ensName} (${formatAddress(address)})` : formatAddress(address)}
      </span>
      <button 
        onClick={() => disconnect()}
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        Déconnecter
      </button>
    </div>
  )
} 