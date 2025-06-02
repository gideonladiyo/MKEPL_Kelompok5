import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';

const API_URL = 'https://api.github.com/users';
const languageColors = {
  'JavaScript': '#f1e05a',
  'TypeScript': '#2b7489',
  'Python': '#3572A5',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C': '#555555',
  'C#': '#239120',
  'PHP': '#4F5D95',
  'Ruby': '#701516',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'Swift': '#ffac45',
  'Kotlin': '#F18E33',
  'Dart': '#00B4AB',
  'HTML': '#e34c26',
  'CSS': '#1572B6',
  'Shell': '#89e051',
  'Vue': '#2c3e50',
  'React': '#61DAFB'
};;

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default function HomePage() {
  const [usernameInput, setUsernameInput] = useState('');
  const [profile, setProfile] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [repos, setRepos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const searchInputRef = useRef(null);

  const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const fetchGitHubData = async (username) => {
    if (!username) return;
    setIsLoading(true);
    setError('');
    setProfile(null);
    setLanguages([]);
    setRepos([]);

    if (!GITHUB_TOKEN) {
      setError("GitHub Token tidak dikonfigurasi dengan benar.");
      setIsLoading(false);
      return;
    }

    const headers = {
      "Authorization": `token ${GITHUB_TOKEN}`
    };

    try {
      const [userRes, reposRes] = await Promise.all([
        fetch(`${API_URL}/${username}`, { headers }),
        fetch(`${API_URL}/${username}/repos?sort=stars&per_page=6`, { headers })
      ]);

      if (!userRes.ok) {
        throw new Error(userRes.status === 404 ? 'User not found' : 'Gagal mengambil data pengguna');
      }
      const userData = await userRes.json();
      const popularReposData = await reposRes.json();

      setProfile(userData);
      setRepos(popularReposData);

      const allReposRes = await fetch(`${API_URL}/${username}/repos?per_page=100`, { headers });
      if (!allReposRes.ok) {
        console.warn(`Tidak dapat mengambil semua repositori untuk statistik bahasa pengguna: ${username}`);
      } else {
        const allReposData = await allReposRes.json();
        const languagePromises = allReposData
          .filter(repo => repo.language && repo.languages_url)
          .slice(0, 20)
          .map(repo => fetch(repo.languages_url, { headers }).then(res => {
            if (!res.ok) return {};
            return res.json();
          }));

        const languagesDataArray = await Promise.all(languagePromises);
        const languageStats = {};
        languagesDataArray.forEach(langData => {
          Object.entries(langData).forEach(([lang, bytes]) => {
            languageStats[lang] = (languageStats[lang] || 0) + bytes;
          });
        });

        const sortedLanguages = Object.entries(languageStats)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([name, bytes]) => ({ name, bytes })); 
        setLanguages(sortedLanguages);
      }

    } catch (err) {
      setError(err.message);
      setProfile(null);
      setLanguages([]);
      setRepos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchGitHubData(usernameInput.trim());
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GitHub Profile Viewer | Next.js</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>

      <div className="container">
        <div className="header">
          <h1>GitHub Profile Viewer</h1>
          <p className="subtitle">Discover amazing developers and their work</p>
          <div className="search-container">
            <div className="search-box">
              <input
                ref={searchInputRef}
                id="searchInput"
                className="search-input"
                type="text"
                placeholder="Enter GitHub username..."
                autoComplete="off"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="search-btn" id="searchBtn" onClick={handleSearch}>
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div id="loading" className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {error && (
          <div id="loading" className="loading error"> 
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
            <p>{error}</p>
          </div>
        )}

        <div id="profileContainer">
          {profile && !isLoading && !error && (
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  <img src={profile.avatar_url} alt={profile.name || profile.login} className="avatar-img" />
                </div>
                <div className="profile-info">
                  <h2 className="profile-name">{profile.name || profile.login}</h2>
                  <p className="profile-username">@{profile.login}</p>
                  {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                  <div className="profile-meta">
                    {profile.location && <div className="meta-item"><i className="fas fa-map-marker-alt"></i> {profile.location}</div>}
                    {profile.company && <div className="meta-item"><i className="fas fa-building"></i> {profile.company}</div>}
                    {profile.blog && <div className="meta-item"><i className="fas fa-link"></i> <a href={profile.blog.startsWith('http') ? profile.blog : 'https://' + profile.blog} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{profile.blog}</a></div>}
                    <div className="meta-item"><i className="fas fa-calendar-alt"></i> Joined {formatDate(profile.created_at)}</div>
                  </div>
                </div>
                <div className="profile-actions">
                  <a href={profile.html_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                    <i className="fab fa-github"></i> View Profile
                  </a>
                  {profile.twitter_username && <a href={`https://twitter.com/${profile.twitter_username}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline"><i className="fab fa-twitter"></i> Twitter</a>}
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{formatNumber(profile.public_repos)}</div>
                  <div className="stat-label">Repositories</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{formatNumber(profile.followers)}</div>
                  <div className="stat-label">Followers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{formatNumber(profile.following)}</div>
                  <div className="stat-label">Following</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{formatNumber(profile.public_gists)}</div>
                  <div className="stat-label">Gists</div>
                </div>
              </div>

              {languages.length > 0 && (
                <div className="languages-section">
                  <h3 className="section-title">
                    <i className="fas fa-code"></i> Top Languages
                  </h3>
                  <div className="languages-grid">
                    {languages.map(lang => (
                      <div key={lang.name} className="language-item">
                        <div className="language-color" style={{ backgroundColor: languageColors[lang.name] || '#858585' }}></div>
                        <span>{lang.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {repos.length > 0 && (
                <div className="repos-section">
                  <h3 className="section-title">
                    <i className="fas fa-star"></i> Popular Repositories
                  </h3>
                  <div className="repos-grid">
                    {repos.map(repo => (
                      <a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer" className="repo-card">
                        <div className="repo-name">{repo.name}</div>
                        {repo.description && <div className="repo-description">{repo.description}</div>}
                        <div className="repo-stats">
                          {repo.language && (
                            <div className="repo-stat">
                              <div className="language-color" style={{ backgroundColor: languageColors[repo.language] || '#858585' }}></div>
                              {repo.language}
                            </div>
                          )}
                          <div className="repo-stat"> <i className="fas fa-star"></i> {repo.stargazers_count} </div>
                          <div className="repo-stat"> <i className="fas fa-code-branch"></i> {repo.forks_count} </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}