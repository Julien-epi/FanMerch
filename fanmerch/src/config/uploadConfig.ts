export const PINATA_CONFIG = {
  jwt: import.meta.env.VITE_PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjZGM5Y2U2NC1hOTE4LTQxMDgtOGEyZC1lZjA1YzllZmRmMWUiLCJlbWFpbCI6Imp1bGllbnJhbnNvbjFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImU5M2Y0NjdjZmIzZTIzYjU1NGRmIiwic2NvcGVkS2V5U2VjcmV0IjoiMTY5MzE5ZTEwNWNjMTIzOWE1NWQ2MTY5ODI5MzJkNWNkM2Q4MjFhODlmNjZiYWQ0MDZiOWZiNzQ4MDU0NmVjNCIsImV4cCI6MTc4Mzg4MTE0NX0.I2lXRhmHUx1wdsig-rB-80rI0ViFlmm-mgDMBtMoQko',
  apiUrl: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
  gateway: 'https://gateway.pinata.cloud/ipfs/'
};

// Fonction d'upload Pinata IPFS
export const uploadToPinata = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Métadonnées pour organiser vos uploads
  const metadata = JSON.stringify({
    name: `fanmerch-${file.name}`,
    keyvalues: {
      project: 'FanMerch-Marketplace',
      uploadDate: new Date().toISOString(),
      fileType: file.type,
      fileSize: file.size.toString()
    }
  });
  formData.append('pinataMetadata', metadata);
  
  const response = await fetch(PINATA_CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_CONFIG.jwt}`
    },
    body: formData
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Pinata (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  const ipfsUrl = `${PINATA_CONFIG.gateway}${data.IpfsHash}`;
  
  console.log('✅ Image uploadée sur IPFS:', {
    hash: data.IpfsHash,
    url: ipfsUrl,
    size: data.PinSize
  });
  
  return ipfsUrl;
}; 