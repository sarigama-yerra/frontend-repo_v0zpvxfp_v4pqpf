import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { CalendarDays, Clock, Ticket, Film, Search } from 'lucide-react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Seat({ id, taken, selected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(id)}
      disabled={taken}
      className={`w-8 h-8 rounded-md text-xs font-medium flex items-center justify-center transition-colors border
        ${taken ? 'bg-gray-800/40 border-gray-700 text-gray-500 cursor-not-allowed' : selected ? 'bg-pink-500 border-pink-400 text-white' : 'bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800'}`}
      aria-label={`Seat ${id}${taken ? ' (taken)' : selected ? ' (selected)' : ''}`}
    >
      {id}
    </button>
  )
}

function SeatGrid({ rows = 8, cols = 12, takenSeats = [], selectedSeats, onToggle }) {
  const grid = []
  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(65 + r)
    const row = []
    for (let c = 1; c <= cols; c++) {
      const id = `${rowLabel}${c}`
      row.push(
        <Seat
          key={id}
          id={id}
          taken={takenSeats.includes(id)}
          selected={selectedSeats.includes(id)}
          onToggle={onToggle}
        />
      )
    }
    grid.push(
      <div key={rowLabel} className="flex gap-2">
        {row}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <div className="mx-auto h-2 w-2/3 rounded bg-gradient-to-r from-fuchsia-500/60 via-cyan-400/60 to-violet-500/60 blur-[1px]" />
      {grid}
    </div>
  )
}

function App() {
  const [movies, setMovies] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [activeMovie, setActiveMovie] = useState(null)
  const [activeShowtime, setActiveShowtime] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [bookingId, setBookingId] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const mv = await fetch(`${API_BASE}/api/movies`).then(r => r.json())
        setMovies(mv)
        if (mv.length) {
          setActiveMovie(mv[0])
          const sts = await fetch(`${API_BASE}/api/showtimes?movie_id=${mv[0]._id}`).then(r => r.json())
          setShowtimes(sts)
        }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    const loadSt = async () => {
      if (!activeMovie) return
      const sts = await fetch(`${API_BASE}/api/showtimes?movie_id=${activeMovie._id}`).then(r => r.json())
      setShowtimes(sts)
      setActiveShowtime(sts[0] || null)
      setSelectedSeats([])
    }
    loadSt()
  }, [activeMovie])

  const filteredMovies = useMemo(() => {
    if (!query) return movies
    return movies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()))
  }, [movies, query])

  const toggleSeat = (id) => {
    setSelectedSeats(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const book = async () => {
    if (!activeShowtime || !name || !email || selectedSeats.length === 0) return
    const res = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showtime_id: activeShowtime._id, customer_name: name, customer_email: email, seats: selectedSeats })
    })
    const data = await res.json()
    if (data && data._id) setBookingId(data._id)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="relative h-[60vh] w-full overflow-hidden">
        <Spline scene="https://prod.spline.design/zks9uYILDPSX-UX6/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/90" />
        <div className="absolute inset-0 flex items-end pb-10 px-6 md:px-12 lg:px-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur ring-1 ring-white/20 mb-4">
              <Ticket className="h-4 w-4 text-fuchsia-300" />
              <span className="text-sm text-fuchsia-200">Futuristic ticketing • Holographic vibes</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-300 via-cyan-300 to-violet-300 drop-shadow-md">
              Book Your Cinema Experience
            </h1>
            <p className="mt-4 text-white/80 max-w-2xl">
              Choose a movie, pick your seats, and secure your glowing digital ticket. Powered by a real database backend.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search movies..." className="w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-3 py-2 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400/50" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 md:px-12 lg:px-20 -mt-12 relative z-10">
        <section className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {loading ? (
                <div className="text-white/70">Loading movies...</div>
              ) : filteredMovies.length === 0 ? (
                <div className="text-white/70">No movies found.</div>
              ) : (
                filteredMovies.map(m => (
                  <button key={m._id} onClick={() => setActiveMovie(m)} className={`group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3 text-left ${activeMovie && activeMovie._id === m._id ? 'ring-2 ring-fuchsia-400/60' : ''}`}>
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-black/40 mb-3">
                      {m.poster_url ? (
                        <img src={m.poster_url} alt={m.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-white/40"><Film className="w-10 h-10" /></div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white">{m.title}</h3>
                    <p className="text-sm text-white/60 line-clamp-2">{m.description || 'No description available'}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
                      <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {m.duration_mins}m</span>
                      {m.genre && <span>{m.genre}</span>}
                      {m.rating && <span>{m.rating}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-cyan-300" /> Available showtimes</h2>
              {activeMovie && showtimes.length === 0 && (
                <p className="text-white/60">No showtimes yet for this movie.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {showtimes.map(st => (
                  <button key={st._id} onClick={() => { setActiveShowtime(st); setSelectedSeats([]) }} className={`px-3 py-1.5 rounded-lg border text-sm transition ${activeShowtime && activeShowtime._id === st._id ? 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40' : 'bg-white/5 text-white/80 border-white/15 hover:bg-white/10'}`}>
                    {new Date(st.start_time).toLocaleString()} • {st.auditorium}
                  </button>
                ))}
              </div>
            </div>

            {activeShowtime && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Ticket className="w-5 h-5 text-fuchsia-300" /> Select your seats</h2>
                <div className="overflow-auto">
                  <div className="inline-block">
                    <SeatGrid rows={activeShowtime.rows} cols={activeShowtime.cols} takenSeats={[]} selectedSeats={selectedSeats} onToggle={toggleSeat} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold mb-2">Your details</h3>
              <div className="space-y-3">
                <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400/50" />
                <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400/50" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold mb-2">Summary</h3>
              <ul className="text-sm text-white/70 space-y-1">
                <li>Movie: <span className="text-white">{activeMovie?.title || '-'}</span></li>
                <li>Showtime: <span className="text-white">{activeShowtime ? new Date(activeShowtime.start_time).toLocaleString() : '-'}</span></li>
                <li>Seats: <span className="text-white">{selectedSeats.length ? selectedSeats.join(', ') : '-'}</span></li>
                <li>Total: <span className="text-white">{activeShowtime ? `$${(activeShowtime.price * selectedSeats.length).toFixed(2)}` : '-'}</span></li>
              </ul>
              <button onClick={book} disabled={!activeShowtime || !name || !email || selectedSeats.length === 0} className="mt-3 w-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-400 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 font-semibold">
                Confirm booking
              </button>
              {bookingId && (
                <p className="mt-2 text-xs text-white/70">Booking confirmed. ID: <span className="text-white">{bookingId}</span></p>
              )}
            </div>
          </aside>
        </section>
      </main>

      <footer className="px-6 md:px-12 lg:px-20 py-10 text-white/60 text-sm">
        © {new Date().getFullYear()} Neon Cinema. All rights reserved.
      </footer>
    </div>
  )
}

export default App
