import React from 'react'
import Spinner from './Spinner.'

const MovieCard = ({ movie, onClick, selectedMovie, isBookMarked, onBookmarkClick }) => {
    const { id, title, vote_average, poster_path, release_date, original_language } = movie;
    const isSelected = selectedMovie === id;

    return (
        <div
            className={`movie-card cursor-pointer relative transition-all duration-200 hover:scale-103${!isSelected ? ' shadow-lg' : ''}`}
            onClick={onClick}
        >
            <img
                src={isBookMarked ? "/bookmarked.svg" : "/not-bookmarked.svg"}
                onClick={event => {
                    event.stopPropagation();
                    onBookmarkClick(movie, event);
                }}
                alt="bookmark"
                className='w-8 h-8 absolute top-7 left-7 bg-black/50 p-1 z-20 backdrop-blur-2xl'
            />
            <img src={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : '/no-movie.png'} alt={title} loading='lazy' />
            <div className='mt-4'>
                <h3>{title}</h3>
                <div className='content'>
                    <div className='rating'>
                        <img src="star.svg" alt="Star Icon" />
                        <p>{vote_average ? vote_average.toFixed(1) : 'N/A'}</p>
                    </div>
                    <span>•</span>
                    <p className='lang'>{original_language}</p>
                    <span>•</span>
                    <p className='year'>{release_date ? new Date(release_date).getFullYear() : 'N/A'}</p>
                </div>
            </div>
            {isSelected && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    backdropFilter: 'blur(3px)'
                }}>
                    <Spinner />
                </div>
            )}
        </div>
    );
}

export default MovieCard