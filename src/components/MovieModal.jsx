import React, { useEffect, useState } from 'react'

function formatMoney(n) {
    if (typeof n !== 'number' || isNaN(n)) return 'N/A';
    if (n >= 1_000_000_000) {
        const val = n / 1_000_000_000;
        return `$${val % 1 === 0 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : val.toFixed(2)} Billion`;
    }
    if (n >= 1_000_000) {
        const val = n / 1_000_000;
        return `$${val % 1 === 0 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : val.toFixed(2)} Million`;
    }
    if (n >= 1_000) {
        const val = n / 1_000;
        return `$${val % 1 === 0 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : val.toFixed(2)} Thousand`;
    }
    return `$${n.toLocaleString()}`;
}

const MovieModal = ({ movieId, setSelectedMovie }) => {

    const API_BASE_URL = 'https://api.themoviedb.org/3';
    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const API_OPTIONS = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${API_KEY}`
        }
    }

    const [movie, setMovie] = useState(null)
    const [trailerUrl, setTrailerUrl] = useState(null)

    const fetchByMovieId = async (movieId) => {
        try {
            // Fetch movie details
            const response = await fetch(`${API_BASE_URL}/movie/${movieId}`, API_OPTIONS);
            const data = await response.json();
            setMovie(data);

            // Fetch videos (trailers)
            const videoRes = await fetch(`${API_BASE_URL}/movie/${movieId}/videos`, API_OPTIONS);
            const videoData = await videoRes.json();
            if (Array.isArray(videoData.results)) {
                const trailer = videoData.results.find(
                    (vid) => vid.site === 'YouTube' && vid.type === 'Trailer'
                );
                if (trailer) {
                    setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
                } else {
                    setTrailerUrl(null);
                }
            }
        } catch (error) {
            console.error("Error fetching movie:", error);
        }
    }

    useEffect(() => {
        fetchByMovieId(movieId);
    }, [movieId]);

    return (
        <>
            {movie != null && (
                <div className='fixed inset-0 z-50 flex flex-col backdrop-blur-2xl w-full h-full bg-[var(--color-dark-100)]/50 overflow-auto'>
                    <div className='sticky top-0 left-0 w-full flex items-center justify-between px-8 py-4 z-50 h-[72px] test bg-[var(--color-dark-100)]/50 backdrop-blur-lg'>
                        <span className='text-xl font-bold text-white truncate max-w-[70vw]'>{movie.title}</span>
                        <button onClick={() => setSelectedMovie(null)}>
                            <img src="close-icon.webp" alt="Close" className='w-10 h-10 invert cursor-pointer' />
                        </button>
                    </div>
                    <div className='flex-1 w-full pt-5 flex flex-col items-center justify-start px-4 max-w-[1250px] self-center'>
                        <div className='flex justify-between items-center w-full text-zinc-400 my-2'>
                            <div className='flex items-center gap-2'>
                                <p className='year'>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
                                <span>•</span>
                                <p className='lang'>{movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A'}</p>
                            </div>
                            <div className='p-2 bg-[var(--color-dark-100)]/60 rounded-lg'>
                                <p className='flex justify-center items-center'><img src="star.svg" alt="Rating" className='inline-block w-4 h-4 mr-1' />{movie.vote_average.toFixed(1)}/10 ({movie.vote_count.toLocaleString()})</p>
                            </div>
                        </div>
                        <div className='flex flex-col sm:flex-row w-full gap-4'>
                            <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className='w-auto sm:max-h-[365px] rounded-lg shadow-lg' />
                            {trailerUrl ? (
                                <>
                                    <iframe className='w-full h-[365px] rounded-xl' src={trailerUrl.replace("watch?v=", "embed/")} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>

                                </>
                            ) : (
                                <p className='text-gray-500'>No trailer available.</p>
                            )}
                        </div>
                        <div className='flex flex-col items-start w-full mt-4 gap-3'>
                            <div className='flex flex-wrap items-center gap-2'>
                                <h3 className='text-lg font-bold text-purple-200 min-w-[140px]'>Genres</h3>
                                <p className='text-gray-300'>{movie.genres.map(genre => (
                                    <span key={genre.id} className='inline-block mr-2 mb-2 px-3 py-1 bg-[#221F3D] rounded-lg'>{genre.name}</span>
                                )) || 'No genres available.'}</p>
                            </div>

                            <div className='flex flex-wrap items-center sm:flex-nowrap gap-2'>
                                <h3 className='text-lg font-bold text-purple-200 min-w-[140px]'>Overview</h3>
                                <p className='text-violet-300'>{movie.overview || 'No overview available.'}</p>
                            </div>

                            <div className='flex items-center flex-wrap gap-2'>
                                <h3 className='text-lg font-bold text-purple-200 min-w-[140px]'>Release Date</h3>
                                <p className='text-violet-300'>{movie.release_date ? new Date(movie.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + '(Worldwide)' : 'N/A'}</p>
                            </div>

                            <div className='flex items-center flex-wrap gap-2'>
                                <h3 className='text-lg font-bold text-purple-200 min-w-[140px]'>Countries</h3>
                                <p className='text-violet-300'>
                                    {movie.production_countries && movie.production_countries.length > 0
                                        ? movie.production_countries.map((country, idx) => (
                                            <span key={country.iso_3166_1}>
                                                {country.name}
                                                {idx < movie.production_countries.length - 1 && <span> • </span>}
                                            </span>
                                        ))
                                        : 'No countries available.'}
                                </p>
                            </div>
                            <div className='flex items-center flex-wrap gap-2'>
                                <h3 className='text-lg font-bold text-purple-200 min-w-[140px]'>Status</h3>
                                <p className='text-violet-300'>{movie.status || 'No status available.'}</p>
                            </div>
                            <div className='flex items-center flex-wrap gap-2'>
                                <h3 className='text-lg font-bold text-purple-200 min-w-[140px]'>Languages</h3>
                                <p className='text-violet-300'>
                                    {movie.spoken_languages && movie.spoken_languages.length > 0
                                        ? movie.spoken_languages.map((lang, idx) => (
                                            <span key={lang.iso_639_1}>
                                                {lang.english_name}
                                                {idx < movie.spoken_languages.length - 1 && <span> • </span>}
                                            </span>
                                        ))
                                        : 'No languages available.'}
                                </p>
                            </div>
                            <div className='flex items-center flex-wrap gap-2'>
                                <h3 className='text-lg font-bold text-purple-200 min-w-[140px]'>Budget</h3>
                                <p className='text-violet-300'>
                                    {movie.budget > 0
                                        ? formatMoney(movie.budget)
                                        : 'No budget available.'}
                                </p>
                            </div>
                            <div className='flex items-center flex-wrap gap-2'>
                                <h3 className='text-lg font-bold text-purple-200 min-w-[140px]'>Revenue</h3>
                                <p className='text-violet-300'>
                                    {movie.revenue > 0
                                        ? formatMoney(movie.revenue)
                                        : 'No revenue available.'}
                                </p>
                            </div>
                            <div className='flex items-center flex-wrap gap-2'>
                                <h3 className='text-lg font-bold text-purple-200 min-w-[140px]'>Tagline</h3>
                                <p className='text-violet-300'>
                                    {movie.tagline || 'No tagline available.'}
                                </p>
                            </div>
                            <div className='flex items-center flex-wrap gap-2 mb-4'>
                                <h3 className='text-lg font-bold text-purple-200 sm:max-w-[140px]'>Production Companies</h3>
                                <p className='text-violet-300'>
                                    {movie.production_companies && movie.production_companies.length > 0
                                        ? movie.production_companies.map((company, idx) => (
                                            <span key={company.id}>
                                                {company.name}
                                                {idx < movie.production_companies.length - 1 && <span> • </span>}
                                            </span>
                                        ))
                                        : 'No production companies available.'}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}

export default MovieModal