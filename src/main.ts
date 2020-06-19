// Core and DOM Variables
const encoder = new TextEncoder()
const sasContainerEl = document.querySelector('#sas-container')
const sasEl = document.querySelector('#sas') as HTMLPreElement
const submitEl = document.querySelector('#submit-button') as HTMLInputElement
const resetEl = document.querySelector('#reset-button') as HTMLInputElement
const uriInput = document.querySelector('#uri') as HTMLInputElement
const saNameInput = document.querySelector('#sa-name') as HTMLInputElement
const saKeyInput = document.querySelector('#sa-key') as HTMLInputElement

// DOM stuff
document.querySelector('#sas-form')?.addEventListener('submit', (evt) => {
  evt.preventDefault()
  disableInputs(uriInput, saNameInput, saKeyInput, submitEl)
  const uri = uriInput.value
  const saName = saNameInput.value
  const saKey = saKeyInput.value
  generateSharedAccessToken(uri, saName, saKey)
    .then(sas => {
      showResult(sas)
      enableInputs(resetEl)
    })
})

resetEl.addEventListener('click', () => {
  uriInput.value = ''
  saNameInput.value = ''
  saKeyInput.value = ''
  enableInputs(uriInput, saNameInput, saKeyInput, submitEl)
  disableInputs(resetEl)
  hideAndClearResult()
})


function disableInputs(...inputs: Array<HTMLInputElement>) {
  inputs.forEach(_ => _.disabled = true)
}

function enableInputs(...inputs: Array<HTMLInputElement>) {
  inputs.forEach(_ => _.disabled = false)
}

function showResult(sas: string) {
  sasContainerEl?.classList.remove('is-hidden')
  sasEl.textContent = sas
}

function hideAndClearResult() {
  sasContainerEl?.classList.add('is-hidden')
}

const durations = {
  days: (days: number) => days * 86400,
  weeks: (weeks: number) => weeks * 604800,
  years: (years: number) => years * 31536000
}

// Main Sig Function
function generateSharedAccessToken(uri: string, saName: string, saKey: string) {
  const encoded = encodeURIComponent(uri)
  const now = new Date()
  const secsInFuture = durations.weeks(1)
  const ttl = Math.round(now.getTime() / 1000) + secsInFuture
  const signature = encoded + '\n' + ttl
  const sigUtf8 = encoder.encode(signature)
  console.log('ttl', ttl)
  console.log('sig', signature)
  console.log('sigUtf8', sigUtf8)
  return getCryptoKey(saKey)
    .then(cryptoKey => {
      return generateToken(sigUtf8, cryptoKey)
    })
    .then(token => {
      console.log('token', token)
      return 'SharedAccessSignature sr=' + encoded + '&sig=' +  
          encodeURIComponent(token) + '&se=' + ttl + '&skn=' + saName; 
    })
}

function getCryptoKey(key: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    {
      name: 'HMAC',
      hash: {
        name: 'SHA-256'
      }
    },
    false,
    ['sign']
  )
}

function generateToken(encodedInfo: Uint8Array, cryptoKey: CryptoKey) {
  return crypto.subtle.sign(
    {name: 'HMAC', hash: {name: 'SHA-265'}},
    cryptoKey,
    encodedInfo
  ).then(tokenBuffer => {
    const bytes = new Uint8Array(tokenBuffer)
    const binary = bytes.reduce((prev, curr) => {
      return prev + String.fromCharCode(curr)
    }, '')
    return btoa(binary)
  })
}

function encodeUtf8(str: string) {
  return unescape(encodeURIComponent(str));
}
