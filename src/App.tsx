import EditorialComparator from './EditorialComparator'
import PreviewAdmin from './PreviewAdmin'

export default function App() {
  return new URLSearchParams(window.location.search).get('admin') === 'etf-sync'
    ? <PreviewAdmin />
    : <><a className="skip-link" href="#main">Přejít na obsah</a><EditorialComparator /></>
}
