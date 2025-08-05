
const Search = ({ searchTerm, setSearchTerm }) => {
    return (
        <div className="search">
            <div>
                <img src="search.svg" alt="search" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search through thousands of movies"
                />
                {searchTerm && searchTerm.length > 0 && (
                    <button type="button" onClick={() => setSearchTerm('')} className="relative right-0 cursor-pointer flex justify-center items-center w-[50px] h-[40px]">
                        <img src="times.svg" alt="clear search" className="w-7 h-7" />
                    </button>

                )}

            </div>

        </div>
    )
}

export default Search