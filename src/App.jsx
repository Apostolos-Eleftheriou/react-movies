import { use, useEffect, useState, useRef, useCallback } from 'react'
import './App.css'
import Search from './components/Search'
import Skeleton from './components/Skeleton'
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
import MovieModal from './components/MovieModal';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import Spinner from './components/Spinner.';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedSearchTerm, setdebouncedSearchTerm] = useState('');
  const [trendingMovies, settrendingMovies] = useState([])
  const [selectedMovie, setselectedMovie] = useState(null)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const container = useRef(null);
  const loader = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useDebounce(() => setdebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchTrendingMovies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trending/movie/day`, API_OPTIONS);
      if (!response.ok) {
        throw new Error('Failed to fetch trending movies');
      }
      const data = await response.json();
      settrendingMovies(data.results || []);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  }

  const fetchMovies = useCallback(async (query = '', pageNum = 1) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&sort_by=popularity.desc&page=${pageNum}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${pageNum}`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      const data = await response.json();
      if (data.Response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMovies([]);
        setHasMore(false);
        return;
      }
      setMovies(prev => pageNum === 1 ? (data.results || []) : [...prev, ...(data.results || [])]);
      setHasMore(data.page < data.total_pages);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setErrorMessage('Failed to fetch movies. Please try again later.');
    } finally {
      setIsLoading(false);
      if (query && container.current && pageNum === 1) {
        container.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  useEffect(() => {
    if (selectedMovie) {
      document.getElementsByTagName('body')[0].style.overflow = 'hidden';
    } else {
      document.getElementsByTagName('body')[0].style.overflow = 'auto';
    }
  }, [selectedMovie]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 1000);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  // Reset movies and page when search changes
  useEffect(() => {
    setPage(1);
    setMovies([]); // Clear previous results before fetching new ones
    fetchMovies(debouncedSearchTerm, 1);
  }, [debouncedSearchTerm, fetchMovies]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || isLoading) return;
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(prev => prev + 1);
      }
    });
    if (loader.current) observer.observe(loader.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  // Fetch next page when page changes
  useEffect(() => {
    if (page === 1) return;
    fetchMovies(debouncedSearchTerm, page);
  }, [page, debouncedSearchTerm, fetchMovies]);


  return (
    <main>
      {showScrollTop && (
        <button
          className='px-2 py-1 bg-[var(--color-dark-100)] z-20 text-white rounded-lg cursor-pointer fixed right-10 bottom-10'
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          &#129129;
        </button>
      )}

      {selectedMovie != null && (
        <MovieModal movieId={selectedMovie} setSelectedMovie={setselectedMovie} />
      )}
      <div className='pattern' />
      <div className='wrapper'>
        <header>
          <img src="./hero.png" alt="Hero banner" />
          <h1 className='text-4xl font-bold'>Find <span className='text-gradient'>Movies</span> You'll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {/* {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.id} onClick={() => setselectedMovie(movie.id)} className='cursor-pointer'>
                  <p>{index + 1}</p>
                  <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )} */}

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <Swiper
              spaceBetween={18}
              slidesPerView="auto"
              freeMode={true}
            >
              {trendingMovies.map((movie, index) => (
                <SwiperSlide key={movie.id}>
                  <ul className='relative transition-all duration-200 hover:scale-103'>
                    <li
                      onClick={() => setselectedMovie(movie.id)}
                      className="cursor-pointer">
                      <p>{index + 1}</p>
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                      />
                    </li>
                    {selectedMovie === movie.id && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        backdropFilter: 'blur(3px)'
                      }}>
                        <Spinner />
                      </div>
                    )}
                  </ul>

                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}


        <section className='all-movies' ref={container}>
          <h2 className='mt-[40px]'>All Movies</h2>
          {errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : movies.length ? (
            <ul>
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} selectedMovie={selectedMovie} onClick={() => setselectedMovie(movie.id)} />
              ))}
            </ul>
          ) : isLoading ? (
            <ul>
              {Array.from({ length: 20 }).map((_, index) => (
                <Skeleton key={index} />
              ))}
            </ul>
          ) : (
            <p className='text-gray-500'>No movies found. Try a different search term.</p>
          )}
          <div ref={loader} />
          {isLoading && page > 1 && <div className='flex w-full justify-center align-center my-2'><Spinner /></div>}
        </section>
      </div>
    </main>
  )
}



export default App
