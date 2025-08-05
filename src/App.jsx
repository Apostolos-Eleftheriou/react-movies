import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
  const [isTrendingMoviesLoading, setisTrendingMoviesLoading] = useState(false);
  const [trendingMoviesError, settrendingMoviesError] = useState('');
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [bookmarkedMovies, setBookmarkedMovies] = useState(() => {
    const storedMovies = localStorage.getItem('bookmarkedMovies');
    return storedMovies ? JSON.parse(storedMovies) : [];
  });

  const [searchBookmarkedTerm, setSearchBookmarkedTerm] = useState('');

  // Handler to add/remove bookmarks and sync with localStorage
  const handleBookmarkClick = (movie) => {
    setBookmarkedMovies(prev => {
      let updated;
      if (prev.some(m => m.id === movie.id)) {
        updated = prev.filter(m => m.id !== movie.id);
      } else {
        updated = [...prev, movie];
      }
      localStorage.setItem('bookmarkedMovies', JSON.stringify(updated));
      return updated;
    });
  };

  // Memoized filtered bookmarks
  const filteredBookmarkedMovies = useMemo(() => {
    if (searchBookmarkedTerm) {
      return bookmarkedMovies.filter(movie =>
        movie.title.toLowerCase().includes(searchBookmarkedTerm.toLowerCase())
      );
    }
    return bookmarkedMovies;
  }, [searchBookmarkedTerm, bookmarkedMovies]);


  useDebounce(() => setdebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchTrendingMovies = async () => {
    setisTrendingMoviesLoading(true);
    settrendingMoviesError('');
    try {
      const response = await fetch(`${API_BASE_URL}/trending/movie/day`, API_OPTIONS);
      if (!response.ok) {
        throw new Error('Failed to fetch trending movies');
      }
      const data = await response.json();
      if (data.Response === 'False') {
        settrendingMoviesError(data.Error || 'Failed to fetch movies');
        settrendingMovies([]);
        return;
      }
      settrendingMovies(data.results || []);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      settrendingMoviesError('Failed to fetch trending movies. Please try again later.');
    } finally {
      setisTrendingMoviesLoading(false);
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
      document.getElementsByTagName('body')[0].classList.add('overflow-hidden');
    } else {
      document.getElementsByTagName('body')[0].classList.remove('overflow-hidden');
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
    setMovies([]);
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
          className='px-2 py-1  backdrop-blur-2xl z-20 text-white rounded-lg cursor-pointer fixed right-10 bottom-10'
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img src="arrow-up.svg" alt="Scroll to top" className='w-6 h-8' />
        </button>
      )}
      {!showBookmarked && (
        <button type='button' className='fixed right-0 top-20 z-20 cursor-pointer'>
          <img src="./bookmarked.svg" alt="Menu" onClick={() => setShowBookmarked(true)} className='w-8 h-8bg-black/50 rounded-l-lg p-1 z-20 backdrop-blur-2xl' />
        </button>
      )}
      <div
        className={
          'fixed right-0 hide-scrollbar top-0 z-20 w-full sm:max-w-[300px] h-full overflow-y-auto overflow-x-hidden bg-[var(--color-dark-100)] transition-transform duration-300 ease-in-out transform ' +
          (showBookmarked ? 'translate-x-0' : 'translate-x-full')
        }
      >
        <div className=' p-2 rounded-b-lg backdrop-blur-2xl sticky top-0 z-30'>
          <div className='flex justify-between items-center '>
            <h3 className='text-white font-bold ml-3'>Bookmarked Movies</h3>
            <button type='button' className='z-40 cursor-pointer' onClick={() => setShowBookmarked(false)}><img src="./times.svg" alt="close" className='w-6 h-6' /></button>
          </div>
          <div className='p-2 w-full mt-2 relative'>
            <input type='text' placeholder='Search Bookmarked' className='w-full outline-none p-3 pr-12 rounded-lg bg-black/50 text-white text-sm' onInput={(e) => setSearchBookmarkedTerm(e.target.value)} value={searchBookmarkedTerm} />
            {searchBookmarkedTerm && (
              <button type='button' className='z-40 cursor-pointer absolute right-5 top-[18px]' onClick={() => setSearchBookmarkedTerm('')}><img src="./times.svg" alt="close" className='w-6 h-6' /></button>
            )}
          </div>
        </div>
        {bookmarkedMovies.length > 0 ? (
          <div className='p-2 gap-4 flex flex-col mb-4'>
            {filteredBookmarkedMovies.length === 0 && (
              <p className='text-center text-gray-400'>No results found</p>
            )}
            {filteredBookmarkedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                selectedMovie={selectedMovie}
                onClick={() => setselectedMovie(movie.id)}
                isBookMarked={true}
                onBookmarkClick={handleBookmarkClick}
              />
            ))}
          </div>
        ) : (
          <p className='text-center text-gray-400'>No bookmarks added yet</p>
        )}
      </div>


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

        {trendingMoviesError ? (
          <p className='text-red-500'>{trendingMoviesError}</p>
        ) : trendingMovies.length ? (
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
                        alt={movie.title} loading={index > 4 ? "lazy" : "eager"}
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
        ) : isTrendingMoviesLoading ? (
          <div className='flex w-full justify-center align-center my-2  mt-10'><Spinner /></div>
        ) : (
          <p className='text-gray-500'>No movies found. Try a different search term.</p>
        )}


        <section className='all-movies' ref={container}>
          <h2 className='mt-[40px]'>All Movies</h2>
          {errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : movies.length ? (
            <ul>
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  selectedMovie={selectedMovie}
                  onClick={() => setselectedMovie(movie.id)}
                  isBookMarked={bookmarkedMovies.some(m => m.id === movie.id)}
                  onBookmarkClick={handleBookmarkClick}
                />
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
