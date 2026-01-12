import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, onSnapshot, addDoc, query, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

// Sexuality options
const SEXUALITIES = [
  'Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 
  'Asexual', 'Demisexual', 'Queer', 'Questioning', 'Fluid', 'Other'
];

// Countries with text codes
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'GR', name: 'Greece' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'TR', name: 'Turkey' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IL', name: 'Israel' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
];

// Random marquee messages
const MARQUEE_MESSAGES = [
  "ur ex is probably on here lol",
  "no judgement zone (jk we're all judging)",
  "what happens here stays here... maybe",
  "catching bodies since 2003",
  "u sure u wanna know??",
  "ur body count is valid bestie",
  "this is gonna be messy",
  "hope ur ready for this tea",
  "the streets are talking",
  "everyone's connected somehow",
  "6 degrees of separation type beat",
  "u might wanna sit down for this",
  "ur friends are definitely on here",
  "no secrets anymore bestie",
  "the math ain't mathing",
];

const getRandomMarquee = () => {
  const shuffled = [...MARQUEE_MESSAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6).map(m => `* ${m.toUpperCase()} `).join('');
};

const useDatabase = () => {
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = {};
      snapshot.forEach((doc) => {
        usersData[doc.id] = doc.data();
      });
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveUser = async (uid, userData) => {
    try {
      await setDoc(doc(db, 'users', uid), userData);
      return { success: true };
    } catch (error) {
      console.error('Error saving user:', error);
      return { error: error.message };
    }
  };

  const getUser = async (uid) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  };

  return { users, saveUser, getUser, loading };
};

const AuthContext = React.createContext(null);

// Loading Screen Component
function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  
  useEffect(() => {
    const duration = 2500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const eased = 1 - Math.pow(1 - rawProgress, 3);
      const currentProgress = Math.floor(eased * 100);
      
      setProgress(currentProgress);
      
      if (currentProgress < 100) {
        requestAnimationFrame(animate);
      } else {
        // Start fade out transition
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            onComplete();
          }, 500);
        }, 300);
      }
    };
    
    requestAnimationFrame(animate);
  }, [onComplete]);

  return (
    <div style={{
      ...styles.loadingScreen,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.5s ease-out'
    }}>
      <div style={styles.loadingContent}>
        <div style={styles.loadingLogo}>CATCHING BODIES</div>
        <div style={styles.loadingSubtitle}>tinder on crack</div>
        <div style={styles.loadingBarContainer}>
          <div style={{
            ...styles.loadingBar, 
            width: `${progress}%`,
            transition: 'width 0.1s linear'
          }}></div>
        </div>
        <div style={styles.loadingPercent}>{progress}%</div>
      </div>
    </div>
  );
}

export default function App() {
  const { users, saveUser, getUser, loading: dbLoading } = useDatabase();
  const [currentUser, setCurrentUser] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [view, setView] = useState('landing');
  const [authLoading, setAuthLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [marqueeText] = useState(getRandomMarquee());
  const [userChats, setUserChats] = useState([]);
  
  const matchSoundRef = useRef(null);
  const noMatchSoundRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user && user.emailVerified) {
        const userData = await getUser(user.uid);
        if (userData) {
          setCurrentUser(userData);
          setView('dashboard');
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load user's chats
  useEffect(() => {
    if (!authUser) return;
    
    const loadChats = async () => {
      try {
        const chatsRef = collection(db, 'chats');
        const chatsSnap = await getDocs(chatsRef);
        const chatList = [];
        
        chatsSnap.forEach(doc => {
          const chatId = doc.id;
          if (chatId.includes(authUser.uid)) {
            const otherUserId = chatId.split('_').find(id => id !== authUser.uid);
            if (otherUserId && users[otherUserId]) {
              chatList.push({
                chatId,
                otherUserId,
                otherUser: users[otherUserId]
              });
            }
          }
        });
        
        setUserChats(chatList);
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };
    
    if (Object.keys(users).length > 0) {
      loadChats();
    }
  }, [authUser, users]);

  const signup = async (email, password, firstName, lastName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await sendEmailVerification(user);
      
      const newUser = { 
        email, 
        firstName, 
        lastName, 
        bodies: [], 
        sexualities: [],
        country: null,
        preferenceEnabled: false,
        yoList: [],
        createdAt: Date.now(),
        uid: user.uid
      };
      await saveUser(user.uid, newUser);
      
      return { success: true, needsVerification: true };
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        return { error: 'email already taken babe' };
      }
      if (error.code === 'auth/weak-password') {
        return { error: 'password too weak (min 6 chars)' };
      }
      return { error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        await signOut(auth);
        return { error: 'check ur email & verify first!', needsVerification: true };
      }
      
      const userData = await getUser(user.uid);
      if (userData) {
        setCurrentUser(userData);
        setAuthUser(user);
        setView('dashboard');
        return { success: true };
      }
      return { error: 'user data not found :(' };
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { error: 'wrong email or password!!' };
      }
      return { error: error.message };
    }
  };

  const resendVerification = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { error: 'could not resend :(' };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setAuthUser(null);
    setView('landing');
  };

  const addBody = async (firstName, lastName) => {
    const updatedUser = {
      ...currentUser,
      bodies: [...currentUser.bodies, { firstName: firstName.trim(), lastName: lastName.trim(), id: Date.now() }]
    };
    await saveUser(authUser.uid, updatedUser);
    setCurrentUser(updatedUser);
  };

  const removeBody = async (bodyId) => {
    const updatedUser = {
      ...currentUser,
      bodies: currentUser.bodies.filter(b => b.id !== bodyId)
    };
    await saveUser(authUser.uid, updatedUser);
    setCurrentUser(updatedUser);
  };

  const updatePreferences = async (sexualities, preferenceEnabled, country) => {
    const updatedUser = {
      ...currentUser,
      sexualities,
      preferenceEnabled,
      country
    };
    await saveUser(authUser.uid, updatedUser);
    setCurrentUser(updatedUser);
  };

  const addToYoList = async (matchedUsers) => {
    const currentYoList = currentUser.yoList || [];
    const newYoList = [...currentYoList];
    
    matchedUsers.forEach(match => {
      if (!newYoList.find(y => y.odomain === match.user.uid)) {
        newYoList.push({
          odomain: match.user.uid,
          firstName: match.user.firstName,
          lastName: match.user.lastName,
          country: match.user.country,
          commonBodies: match.commonBodies,
          matchedAt: Date.now()
        });
      }
    });
    
    const updatedUser = {
      ...currentUser,
      yoList: newYoList
    };
    await saveUser(authUser.uid, updatedUser);
    setCurrentUser(updatedUser);
  };

  const playMatchSound = () => {
    if (matchSoundRef.current) {
      matchSoundRef.current.currentTime = 0;
      matchSoundRef.current.play().catch(e => console.log('Sound play failed:', e));
    }
  };

  const playNoMatchSound = () => {
    if (noMatchSoundRef.current) {
      noMatchSoundRef.current.currentTime = 0;
      noMatchSoundRef.current.play().catch(e => console.log('Sound play failed:', e));
    }
  };

  const findMatches = () => {
    const myBodies = currentUser.bodies.map(b => `${b.firstName} ${b.lastName}`.toLowerCase());
    const matches = [];
    
    Object.values(users).forEach(user => {
      if (user.uid === currentUser.uid) return;
      
      if (currentUser.preferenceEnabled && currentUser.sexualities?.length > 0) {
        const theirSexualities = user.sexualities || [];
        const hasMatchingSexuality = currentUser.sexualities.some(s => theirSexualities.includes(s));
        if (!hasMatchingSexuality) return;
      }
      
      const theirBodies = (user.bodies || []).map(b => `${b.firstName} ${b.lastName}`.toLowerCase());
      const commonBodies = myBodies.filter(body => theirBodies.includes(body));
      
      if (commonBodies.length > 0) {
        matches.push({
          user,
          commonBodies: commonBodies.map(name => {
            const parts = name.split(' ');
            return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
          })
        });
      }
    });
    return matches;
  };

  const createChat = async (otherUserId) => {
    const chatId = [authUser.uid, otherUserId].sort().join('_');
    await setDoc(doc(db, 'chats', chatId), {
      participants: [authUser.uid, otherUserId],
      createdAt: serverTimestamp()
    }, { merge: true });
    return chatId;
  };

  if (initialLoading) {
    return <LoadingScreen onComplete={() => setInitialLoading(false)} />;
  }

  if (authLoading || dbLoading) {
    return <LoadingScreen onComplete={() => {}} />;
  }

  return (
    <AuthContext.Provider value={{ 
      currentUser, signup, login, logout, addBody, removeBody, findMatches, users,
      resendVerification, playMatchSound, playNoMatchSound, updatePreferences, marqueeText,
      authUser, saveUser, setCurrentUser, addToYoList, createChat, userChats
    }}>
      <style>{globalStyles}</style>
      
      <audio ref={matchSoundRef} src="/match-sound.mp4" preload="auto" />
      <audio ref={noMatchSoundRef} src="/no-match-sound.mp4" preload="auto" />
      
      <div style={styles.app}>
        <div style={styles.scanlines}></div>
        {view === 'landing' && <Landing setView={setView} />}
        {view === 'signup' && <Signup setView={setView} />}
        {view === 'login' && <Login setView={setView} />}
        {view === 'verify' && <VerifyEmail setView={setView} />}
        {view === 'dashboard' && <Dashboard setView={setView} />}
        {view === 'preferences' && <Preferences setView={setView} />}
        {view === 'yolist' && <YoList setView={setView} />}
        {view === 'chats' && <ChatList setView={setView} />}
        {view.startsWith('chat:') && <Chat setView={setView} chatUserId={view.split(':')[1]} />}
      </div>
    </AuthContext.Provider>
  );
}

function Landing({ setView }) {
  const { marqueeText } = React.useContext(AuthContext);
  
  return (
    <div style={styles.landing}>
      <div style={styles.marqueeContainer}>
        <div style={styles.marquee}>
          {marqueeText}{marqueeText}
        </div>
      </div>
      
      <div style={styles.landingMain}>
        <div style={styles.orbitalContainer}>
          <div style={styles.orbit1}></div>
          <div style={styles.orbit2}></div>
          <div style={styles.orbit3}></div>
          
          <div style={styles.logoBox}>
            <div style={styles.star1}>+</div>
            <div style={styles.star2}>*</div>
            <h1 style={styles.logo}>
              CATCHING<br/>BODIES
            </h1>
            <div style={styles.logoSubtitle}>v2.0</div>
            <div style={styles.star3}>+</div>
          </div>
        </div>
        
        <div style={styles.tagline}>
          ~ find out who's been with ur bodies ~
        </div>
        
        <div style={styles.landingBtns}>
          <button style={styles.btnPrimary} onClick={() => setView('signup')}>
            * sign me up! *
          </button>
          <button style={styles.btnSecondary} onClick={() => setView('login')}>
            &gt;&gt; already a member &lt;&lt;
          </button>
        </div>
        
        <div style={styles.visitorCounter}>
          <span style={styles.visitorText}>* tinder on crack *</span>
        </div>
      </div>
      
      <div style={styles.footer}>
        <span>best viewed in 800x600</span>
        <span>|</span>
        <span>netscape navigator</span>
        <span>|</span>
        <span>2003</span>
      </div>
    </div>
  );
}

function Signup({ setView }) {
  const { signup } = React.useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || !firstName || !lastName) {
      setError('fill everything out dummy!!');
      return;
    }
    if (password.length < 6) {
      setError('password needs 6+ characters');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await signup(email, password, firstName, lastName);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.needsVerification) {
      setView('verify');
    }
  };

  return (
    <div style={styles.authPage}>
      <button style={styles.backBtn} onClick={() => setView('landing')}>{'<< back'}</button>
      
      <div style={styles.authBox}>
        <div style={styles.authHeader}>
          <span style={styles.authStar}>*</span>
          <h2 style={styles.authTitle}>JOIN US!</h2>
          <span style={styles.authStar}>*</span>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>ur email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            placeholder="hotbabe@gmail.com"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            placeholder="********"
          />
        </div>
        
        <div style={styles.nameFields}>
          <div style={styles.formGroup}>
            <label style={styles.label}>first name:</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              style={styles.input}
              placeholder="Alex"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>last name:</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              style={styles.input}
              placeholder="Mall"
            />
          </div>
        </div>
        
        {error && <div style={styles.error}>!! {error} !!</div>}
        
        <button style={styles.submitBtn} onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'CREATING...' : 'CREATE ACCOUNT >>'}
        </button>
        
        <div style={styles.authSwitch}>
          already registered? <span style={styles.link} onClick={() => setView('login')}>click here 2 login</span>
        </div>
      </div>
      
      <div style={styles.decoration}>+ * + * +</div>
    </div>
  );
}

function VerifyEmail({ setView }) {
  return (
    <div style={styles.authPage}>
      <div style={styles.authBox}>
        <div style={styles.authHeader}>
          <span style={styles.authStar}>[!]</span>
          <h2 style={styles.authTitle}>CHECK UR EMAIL!</h2>
          <span style={styles.authStar}>[!]</span>
        </div>
        
        <div style={styles.verifyText}>
          <p>we sent u a verification link</p>
          <p style={styles.verifySmall}>click it then come back & login</p>
        </div>
        
        <button style={styles.submitBtn} onClick={() => setView('login')}>
          GO TO LOGIN &gt;&gt;
        </button>
      </div>
      
      <div style={styles.decoration}>+ * + * +</div>
    </div>
  );
}

function Login({ setView }) {
  const { login, resendVerification } = React.useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('enter email & password!!');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await login(email, password);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      if (result.needsVerification) {
        setShowResend(true);
      }
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    const result = await resendVerification(email, password);
    setIsLoading(false);
    if (result.success) {
      setError('');
      alert('Verification email sent! Check ur inbox');
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={styles.authPage}>
      <button style={styles.backBtn} onClick={() => setView('landing')}>{'<< back'}</button>
      
      <div style={styles.authBox}>
        <div style={styles.authHeader}>
          <span style={styles.authStar}>+</span>
          <h2 style={styles.authTitle}>WELCOME BACK</h2>
          <span style={styles.authStar}>+</span>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>ur email:</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={styles.input}
            placeholder="hotbabe@gmail.com"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>password:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
            placeholder="********"
          />
        </div>
        
        {error && <div style={styles.error}>!! {error} !!</div>}
        
        {showResend && (
          <button style={styles.resendBtn} onClick={handleResend} disabled={isLoading}>
            resend verification email
          </button>
        )}
        
        <button style={styles.submitBtn} onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'CHECKING...' : 'LET ME IN >>'}
        </button>
        
        <div style={styles.authSwitch}>
          new here? <span style={styles.link} onClick={() => setView('signup')}>sign up now!</span>
        </div>
      </div>
      
      <div style={styles.decoration}>+ * + * +</div>
    </div>
  );
}

function Preferences({ setView }) {
  const { currentUser, updatePreferences } = React.useContext(AuthContext);
  const [selectedSexualities, setSelectedSexualities] = useState(currentUser.sexualities || []);
  const [preferenceEnabled, setPreferenceEnabled] = useState(currentUser.preferenceEnabled || false);
  const [selectedCountry, setSelectedCountry] = useState(currentUser.country || null);
  const [saving, setSaving] = useState(false);

  const toggleSexuality = (sexuality) => {
    if (selectedSexualities.includes(sexuality)) {
      setSelectedSexualities(selectedSexualities.filter(s => s !== sexuality));
    } else {
      setSelectedSexualities([...selectedSexualities, sexuality]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await updatePreferences(selectedSexualities, preferenceEnabled, selectedCountry);
    setSaving(false);
    setView('dashboard');
  };

  return (
    <div style={styles.authPage}>
      <button style={styles.backBtn} onClick={() => setView('dashboard')}>{'<< back'}</button>
      
      <div style={{...styles.authBox, maxWidth: '500px', maxHeight: '80vh', overflow: 'auto'}}>
        <div style={styles.authHeader}>
          <span style={styles.authStar}>[+]</span>
          <h2 style={styles.authTitle}>PREFERENCES</h2>
          <span style={styles.authStar}>[+]</span>
        </div>
        
        <div style={styles.prefSection}>
          <div style={styles.label}>ur country:</div>
          <div style={styles.countryGrid}>
            {COUNTRIES.map(country => (
              <button
                key={country.code}
                style={{
                  ...styles.countryBtn,
                  ...(selectedCountry === country.code ? styles.countryBtnActive : {})
                }}
                onClick={() => setSelectedCountry(country.code)}
                title={country.name}
              >
                {country.code}
              </button>
            ))}
          </div>
        </div>
        
        <div style={styles.prefSection}>
          <label style={styles.prefLabel}>
            <input
              type="checkbox"
              checked={preferenceEnabled}
              onChange={e => setPreferenceEnabled(e.target.checked)}
              style={styles.checkbox}
            />
            <span>Only match with people who share my sexuality</span>
          </label>
        </div>
        
        <div style={styles.prefSection}>
          <div style={styles.label}>ur sexuality (select all that apply):</div>
          <div style={styles.sexualityGrid}>
            {SEXUALITIES.map(sexuality => (
              <button
                key={sexuality}
                style={{
                  ...styles.sexualityBtn,
                  ...(selectedSexualities.includes(sexuality) ? styles.sexualityBtnActive : {})
                }}
                onClick={() => toggleSexuality(sexuality)}
              >
                {sexuality}
              </button>
            ))}
          </div>
        </div>
        
        <button style={styles.submitBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'SAVING...' : 'SAVE PREFERENCES >>'}
        </button>
      </div>
    </div>
  );
}

function YoList({ setView }) {
  const { currentUser } = React.useContext(AuthContext);
  const yoList = currentUser.yoList || [];

  return (
    <div style={styles.dashboard}>
      <div style={styles.dashHeader}>
        <button style={styles.backBtnHeader} onClick={() => setView('dashboard')}>{'<< back'}</button>
        <div style={styles.dashLogo}>* YO LIST *</div>
        <div style={{width: 60}}></div>
      </div>

      <div style={styles.dashContent}>
        <div style={styles.yoListInfo}>
          <p>people who caught the same bodies as u</p>
          <p style={styles.yoListSubtext}>(read only - u matched with these people)</p>
        </div>

        <div style={styles.listSection}>
          <div style={styles.bodyList}>
            {yoList.length === 0 ? (
              <div style={styles.empty}>
                <div>no matches yet...</div>
                <div style={styles.emptySmall}>find some matches first!</div>
              </div>
            ) : (
              yoList.map((yo, i) => (
                <div key={yo.odomain} style={styles.yoItem}>
                  <div style={styles.yoItemHeader}>
                    <span style={styles.yoName}>
                      [{yo.country || '??'}] {yo.firstName} {yo.lastName}
                    </span>
                    <span style={styles.yoBadge}>{yo.commonBodies.length} shared</span>
                  </div>
                  <div style={styles.yoBodies}>
                    {yo.commonBodies.map(b => `${b.firstName} ${b.lastName}`).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatList({ setView }) {
  const { userChats } = React.useContext(AuthContext);

  return (
    <div style={styles.dashboard}>
      <div style={styles.dashHeader}>
        <button style={styles.backBtnHeader} onClick={() => setView('dashboard')}>{'<< back'}</button>
        <div style={styles.dashLogo}>* CHATS *</div>
        <div style={{width: 60}}></div>
      </div>

      <div style={styles.dashContent}>
        <div style={styles.listSection}>
          <div style={styles.bodyList}>
            {userChats.length === 0 ? (
              <div style={styles.empty}>
                <div>no chats yet...</div>
                <div style={styles.emptySmall}>match with someone to start chatting!</div>
              </div>
            ) : (
              userChats.map((chat) => (
                <div 
                  key={chat.chatId} 
                  style={styles.chatListItem}
                  onClick={() => setView(`chat:${chat.otherUserId}`)}
                >
                  <span style={styles.chatListName}>
                    [{chat.otherUser.country || '??'}] {chat.otherUser.firstName} {chat.otherUser.lastName}
                  </span>
                  <span style={styles.chatListArrow}>&gt;&gt;</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ setView }) {
  const { currentUser, logout, addBody, removeBody, findMatches, playMatchSound, playNoMatchSound, addToYoList, createChat } = React.useContext(AuthContext);
  const [showAdd, setShowAdd] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [matches, setMatches] = useState([]);
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');

  const handleAdd = () => {
    if (newFirst && newLast) {
      addBody(newFirst, newLast);
      setNewFirst('');
      setNewLast('');
      setShowAdd(false);
    }
  };

  const handleMatch = () => {
    const foundMatches = findMatches();
    setMatches(foundMatches);
    setShowMatches(true);
    
    if (foundMatches.length > 0) {
      playMatchSound();
      // Do async stuff in background, don't block modal
      addToYoList(foundMatches).catch(e => console.log('YoList error:', e));
      foundMatches.forEach(match => {
        createChat(match.user.uid).catch(e => console.log('Chat error:', e));
      });
    } else {
      playNoMatchSound();
    }
  };

  const getMatchText = () => {
    if (matches.length === 0) return '';
    if (matches.length === 1) {
      return `You and ${matches[0].user.firstName} ${matches[0].user.lastName} have caught the same body`;
    }
    const names = matches.map(m => `${m.user.firstName} ${m.user.lastName}`);
    if (names.length === 2) {
      return `You and ${names[0]} and ${names[1]} have caught the same bodies`;
    }
    return `You and ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} have caught the same bodies`;
  };

  return (
    <div style={styles.dashboard}>
      <div style={styles.dashHeader}>
        <div style={styles.dashLogo}>* CATCHING BODIES *</div>
        <div style={styles.dashUser}>
          <button style={styles.navBtn} onClick={() => setView('chats')}>[chat]</button>
          <button style={styles.navBtn} onClick={() => setView('yolist')}>[list]</button>
          <button style={styles.navBtn} onClick={() => setView('preferences')}>[settings]</button>
          <span>[{currentUser.country || '??'}] {currentUser.firstName}</span>
          <button style={styles.logoutBtn} onClick={logout}>[x]</button>
        </div>
      </div>

      <div style={styles.dashContent}>
        <div style={styles.statsBox}>
          <div style={styles.statsLabel}>ur body count:</div>
          <div style={styles.statsNum}>{currentUser.bodies.length}</div>
          <div style={styles.statsStars}>{'*'.repeat(Math.min(currentUser.bodies.length, 10))}</div>
        </div>

        <div style={styles.listSection}>
          <div style={styles.listHeader}>
            <h3 style={styles.listTitle}>~ THE LIST ~</h3>
            <button style={styles.addBtn} onClick={() => setShowAdd(true)}>+ add body</button>
          </div>

          <div style={styles.bodyList}>
            {currentUser.bodies.length === 0 ? (
              <div style={styles.empty}>
                <div>no bodies yet...</div>
                <div style={styles.emptySmall}>add some names 2 get started!</div>
              </div>
            ) : (
              currentUser.bodies.map((body, i) => (
                <div key={body.id} style={styles.bodyItem}>
                  <span style={styles.bodyNum}>#{i + 1}</span>
                  <span style={styles.bodyName}>{body.firstName} {body.lastName}</span>
                  <button style={styles.deleteBtn} onClick={() => removeBody(body.id)}>x</button>
                </div>
              ))
            )}
          </div>
        </div>

        <button 
          style={{...styles.matchBtn, opacity: currentUser.bodies.length === 0 ? 0.5 : 1}}
          onClick={handleMatch}
          disabled={currentUser.bodies.length === 0}
        >
          *** FIND WHO CAUGHT THE SAME BODIES AS U ***
        </button>
      </div>

      {showAdd && (
        <div style={styles.overlay} onClick={() => setShowAdd(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>~ ADD A BODY ~</div>
            <input
              style={styles.modalInput}
              placeholder="first name"
              value={newFirst}
              onChange={e => setNewFirst(e.target.value)}
            />
            <input
              style={styles.modalInput}
              placeholder="last name"
              value={newLast}
              onChange={e => setNewLast(e.target.value)}
            />
            <button style={styles.modalBtn} onClick={handleAdd}>ADD 2 LIST &gt;&gt;</button>
            <button style={styles.modalClose} onClick={() => setShowAdd(false)}>[close]</button>
          </div>
        </div>
      )}

      {showMatches && (
        <div style={styles.overlay} onClick={() => setShowMatches(false)}>
          <div style={styles.matchModal} onClick={e => e.stopPropagation()}>
            <div style={styles.matchHeader}>
              {matches.length > 0 ? '*** MATCH FOUND ***' : ':-('}
            </div>
            
            {matches.length === 0 ? (
              <div style={styles.noMatch}>
                <div style={styles.noMatchEmoji}>X_X</div>
                <div style={styles.noMatchText}>nobody caught your bodies...yet</div>
              </div>
            ) : (
              <div style={styles.matchContent}>
                <div style={styles.matchText}>{getMatchText()}</div>
                <div style={styles.matchList}>
                  {matches.map((m, i) => (
                    <div key={i} style={styles.matchItem}>
                      <div style={styles.matchUserInfo}>
                        <span style={styles.matchName}>
                          [{m.user.country || '??'}] {m.user.firstName} {m.user.lastName}
                        </span>
                        <span style={styles.matchBadge}>{m.commonBodies.length} in common</span>
                      </div>
                      <div style={styles.matchBodies}>
                        {m.commonBodies.map(b => `${b.firstName} ${b.lastName}`).join(', ')}
                      </div>
                      <button 
                        style={styles.chatBtn}
                        onClick={() => {
                          setShowMatches(false);
                          setView(`chat:${m.user.uid}`);
                        }}
                      >
                        [SEND MESSAGE]
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button style={styles.modalClose} onClick={() => setShowMatches(false)}>[close window]</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chat({ setView, chatUserId }) {
  const { currentUser, users, authUser } = React.useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const otherUser = users[chatUserId];
  const chatId = [authUser.uid, chatUserId].sort().join('_');

  useEffect(() => {
    const initChat = async () => {
      await setDoc(doc(db, 'chats', chatId), {
        participants: [authUser.uid, chatUserId],
        createdAt: serverTimestamp()
      }, { merge: true });
    };
    initChat();

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error('Error loading messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, authUser.uid, chatUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: newMessage.trim(),
        senderId: authUser.uid,
        senderName: `${currentUser.firstName} ${currentUser.lastName}`,
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!otherUser) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authBox}>
          <p>User not found</p>
          <button style={styles.submitBtn} onClick={() => setView('dashboard')}>GO BACK</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.chatContainer}>
      <div style={styles.chatHeader}>
        <button style={styles.backBtnChat} onClick={() => setView('chats')}>{'<< back'}</button>
        <div style={styles.chatTitle}>
          [{otherUser.country || '??'}] {otherUser.firstName} {otherUser.lastName}
        </div>
      </div>
      
      <div style={styles.chatMessages}>
        {loading ? (
          <div style={styles.chatLoading}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={styles.chatEmpty}>No messages yet. Say hi!</div>
        ) : (
          messages.map(msg => (
            <div 
              key={msg.id} 
              style={{
                ...styles.message,
                ...(msg.senderId === authUser.uid ? styles.messageSent : styles.messageReceived)
              }}
            >
              <div style={styles.messageSender}>
                {msg.senderId === authUser.uid ? 'You' : otherUser.firstName}
              </div>
              <div style={styles.messageText}>{msg.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={styles.chatInput}>
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="type ur message..."
          style={styles.chatInputField}
        />
        <button style={styles.chatSendBtn} onClick={sendMessage}>SEND</button>
      </div>
    </div>
  );
}

const globalStyles = `
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(5deg); }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes spinReverse {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(-360deg); }
  }
  
  @keyframes loadingPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes loadingGlow {
    0%, 100% { box-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff; }
    50% { box-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 60px #ff00ff; }
  }
`;

const styles = {
  app: {
    minHeight: '100vh',
    background: '#000080',
    fontFamily: "'VT323', monospace",
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  
  scanlines: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
    pointerEvents: 'none',
    zIndex: 1000,
  },
  
  loadingScreen: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'VT323', monospace",
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  
  loadingContent: {
    textAlign: 'center',
    padding: '2rem',
  },
  
  loadingLogo: {
    fontSize: '2.5rem',
    color: '#ff00ff',
    marginBottom: '0.5rem',
    textShadow: '0 0 10px #ff00ff',
    animation: 'loadingPulse 2s infinite',
  },
  
  loadingSubtitle: {
    fontSize: '1.5rem',
    color: '#ffff00',
    marginBottom: '2rem',
    fontStyle: 'italic',
  },
  
  loadingBarContainer: {
    width: '300px',
    height: '30px',
    background: '#000',
    border: '3px solid #ff00ff',
    borderRadius: '4px',
    overflow: 'hidden',
    margin: '0 auto',
  },
  
  loadingBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #ff00ff 0%, #00ffff 50%, #ff00ff 100%)',
    animation: 'loadingGlow 1s infinite',
  },
  
  loadingPercent: {
    fontSize: '1.5rem',
    color: '#00ffff',
    marginTop: '1rem',
  },
  
  landing: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #0a0a3e 0%, #1a0a4e 50%, #0a0a3e 100%)',
  },
  
  marqueeContainer: {
    background: '#ff00ff',
    padding: '8px 0',
    overflow: 'hidden',
    borderBottom: '4px solid #ffff00',
  },
  
  marquee: {
    display: 'inline-block',
    whiteSpace: 'nowrap',
    animation: 'marquee 20s linear infinite',
    fontSize: '1.1rem',
    color: '#000',
    fontWeight: 'bold',
  },
  
  landingMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  
  orbitalContainer: {
    position: 'relative',
    width: '320px',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  
  orbit1: {
    position: 'absolute',
    width: '300px',
    height: '120px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    animation: 'spin 20s linear infinite',
  },
  
  orbit2: {
    position: 'absolute',
    width: '340px',
    height: '140px',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '50%',
    animation: 'spinReverse 25s linear infinite',
    transform: 'rotate(15deg)',
  },
  
  orbit3: {
    position: 'absolute',
    width: '380px',
    height: '160px',
    border: '2px solid rgba(255,255,255,0.15)',
    borderRadius: '50%',
    animation: 'spin 30s linear infinite',
    transform: 'rotate(-10deg)',
  },
  
  logoBox: {
    position: 'relative',
    background: 'linear-gradient(180deg, #ff6b9d 0%, #ff00ff 100%)',
    padding: '20px 40px',
    border: '4px solid #fff',
    boxShadow: '8px 8px 0 #000, inset 0 0 20px rgba(255,255,255,0.3)',
    zIndex: 10,
  },
  
  star1: {
    position: 'absolute',
    top: -15,
    left: -15,
    fontSize: '1.5rem',
    color: '#ffff00',
    animation: 'float 2s ease-in-out infinite',
  },
  
  star2: {
    position: 'absolute',
    top: -10,
    right: -10,
    fontSize: '1.2rem',
    color: '#00ffff',
    animation: 'float 2.5s ease-in-out infinite',
  },
  
  star3: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '1.2rem',
    color: '#ffff00',
    animation: 'float 3s ease-in-out infinite',
  },
  
  logo: {
    fontFamily: "'Comic Neue', cursive",
    fontSize: 'clamp(2rem, 7vw, 3rem)',
    textAlign: 'center',
    margin: 0,
    lineHeight: 0.9,
    color: '#fff',
    textShadow: '3px 3px 0 #000, -1px -1px 0 #ffff00',
  },
  
  logoSubtitle: {
    textAlign: 'center',
    fontSize: '1.2rem',
    color: '#ffff00',
    marginTop: '0.5rem',
  },
  
  tagline: {
    fontSize: '1.3rem',
    color: '#00ffff',
    marginBottom: '2rem',
    textAlign: 'center',
  },
  
  landingBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '280px',
  },
  
  btnPrimary: {
    padding: '15px 30px',
    fontSize: '1.3rem',
    fontFamily: "'VT323', monospace",
    background: 'linear-gradient(180deg, #ffff00 0%, #ff9900 100%)',
    border: '4px solid #000',
    boxShadow: '4px 4px 0 #000',
    color: '#000',
    cursor: 'pointer',
  },
  
  btnSecondary: {
    padding: '12px 25px',
    fontSize: '1.2rem',
    fontFamily: "'VT323', monospace",
    background: 'transparent',
    border: '3px solid #00ffff',
    color: '#00ffff',
    cursor: 'pointer',
  },
  
  visitorCounter: {
    marginTop: '3rem',
    padding: '10px 20px',
    background: '#000',
    border: '2px solid #333',
  },
  
  visitorText: {
    fontSize: '0.9rem',
    color: '#888',
  },
  
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    padding: '1rem',
    fontSize: '0.9rem',
    color: '#888',
    borderTop: '2px dashed #333',
  },
  
  authPage: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'linear-gradient(180deg, #1a0a4e 0%, #0a0a3e 100%)',
  },
  
  backBtn: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'none',
    border: 'none',
    color: '#00ffff',
    fontFamily: "'VT323', monospace",
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  
  backBtnHeader: {
    background: 'none',
    border: 'none',
    color: '#00ffff',
    fontFamily: "'VT323', monospace",
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  
  backBtnChat: {
    background: 'none',
    border: 'none',
    color: '#00ffff',
    fontFamily: "'VT323', monospace",
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: 0,
  },
  
  authBox: {
    background: '#000',
    border: '4px solid #ff00ff',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '8px 8px 0 #ff00ff33',
  },
  
  authHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '1.5rem',
  },
  
  authStar: {
    fontSize: '1.5rem',
    color: '#ffff00',
  },
  
  authTitle: {
    fontSize: '1.8rem',
    color: '#ff00ff',
    margin: 0,
    textShadow: '2px 2px 0 #000',
  },
  
  formGroup: {
    marginBottom: '1rem',
  },
  
  nameFields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  
  label: {
    display: 'block',
    fontSize: '1.1rem',
    color: '#00ffff',
    marginBottom: '5px',
  },
  
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '1.1rem',
    fontFamily: "'VT323', monospace",
    background: '#1a1a2e',
    border: '3px solid #333',
    color: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
    padding: '10px',
    background: '#330000',
    marginBottom: '1rem',
    fontSize: '1.1rem',
  },
  
  submitBtn: {
    width: '100%',
    padding: '15px',
    fontSize: '1.3rem',
    fontFamily: "'VT323', monospace",
    background: 'linear-gradient(180deg, #ff00ff 0%, #ff6b6b 100%)',
    border: '3px solid #fff',
    color: '#fff',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  
  resendBtn: {
    width: '100%',
    padding: '10px',
    fontSize: '1rem',
    fontFamily: "'VT323', monospace",
    background: 'transparent',
    border: '2px solid #ffff00',
    color: '#ffff00',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  
  authSwitch: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: '#888',
    fontSize: '1.1rem',
  },
  
  link: {
    color: '#ffff00',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  
  decoration: {
    marginTop: '2rem',
    fontSize: '1.5rem',
    color: '#ff00ff',
    letterSpacing: '10px',
  },
  
  verifyText: {
    textAlign: 'center',
    color: '#00ffff',
    fontSize: '1.3rem',
    marginBottom: '2rem',
  },
  
  verifySmall: {
    fontSize: '1rem',
    color: '#888',
    marginTop: '0.5rem',
  },
  
  prefSection: {
    marginBottom: '1.5rem',
  },
  
  prefLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#fff',
    fontSize: '1.1rem',
    cursor: 'pointer',
  },
  
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  
  sexualityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginTop: '10px',
  },
  
  sexualityBtn: {
    padding: '10px',
    fontSize: '1rem',
    fontFamily: "'VT323', monospace",
    background: '#1a1a2e',
    border: '2px solid #333',
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  sexualityBtnActive: {
    background: '#ff00ff33',
    borderColor: '#ff00ff',
    color: '#fff',
  },
  
  countryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '6px',
    marginTop: '10px',
    maxHeight: '150px',
    overflow: 'auto',
  },
  
  countryBtn: {
    padding: '8px 4px',
    fontSize: '0.9rem',
    fontFamily: "'VT323', monospace",
    background: '#1a1a2e',
    border: '2px solid #333',
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  countryBtnActive: {
    background: '#ff00ff33',
    borderColor: '#ff00ff',
    color: '#fff',
  },
  
  dashboard: {
    minHeight: '100vh',
    background: '#0a0a1a',
  },
  
  dashHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    background: '#000',
    borderBottom: '4px solid #ff00ff',
    flexWrap: 'wrap',
    gap: '10px',
  },
  
  dashLogo: {
    fontSize: '1.3rem',
    color: '#ff00ff',
  },
  
  dashUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#00ffff',
    fontSize: '1rem',
    flexWrap: 'wrap',
  },
  
  navBtn: {
    background: 'none',
    border: '1px solid #333',
    color: '#00ffff',
    fontFamily: "'VT323', monospace",
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '5px 10px',
  },
  
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontFamily: "'VT323', monospace",
    fontSize: '1rem',
    cursor: 'pointer',
  },
  
  dashContent: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  
  statsBox: {
    background: 'linear-gradient(180deg, #ff00ff33 0%, #4b008233 100%)',
    border: '4px solid #ff00ff',
    padding: '1.5rem',
    textAlign: 'center',
    marginBottom: '2rem',
  },
  
  statsLabel: {
    fontSize: '1.2rem',
    color: '#888',
  },
  
  statsNum: {
    fontSize: '5rem',
    color: '#ffff00',
    textShadow: '4px 4px 0 #000',
    lineHeight: 1,
  },
  
  statsStars: {
    color: '#ff00ff',
    fontSize: '1.5rem',
    marginTop: '0.5rem',
  },
  
  listSection: {
    background: '#000',
    border: '3px solid #333',
    marginBottom: '2rem',
  },
  
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '2px dashed #333',
  },
  
  listTitle: {
    margin: 0,
    fontSize: '1.3rem',
    color: '#00ffff',
  },
  
  addBtn: {
    padding: '8px 15px',
    fontSize: '1rem',
    fontFamily: "'VT323', monospace",
    background: '#00ffff',
    border: 'none',
    color: '#000',
    cursor: 'pointer',
  },
  
  bodyList: {
    maxHeight: '300px',
    overflow: 'auto',
  },
  
  empty: {
    padding: '3rem 1rem',
    textAlign: 'center',
    color: '#666',
    fontSize: '1.2rem',
  },
  
  emptySmall: {
    fontSize: '1rem',
    marginTop: '0.5rem',
  },
  
  bodyItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    borderBottom: '1px solid #222',
  },
  
  bodyNum: {
    color: '#ff00ff',
    marginRight: '15px',
    fontSize: '1.1rem',
  },
  
  bodyName: {
    flex: 1,
    textTransform: 'capitalize',
    fontSize: '1.2rem',
  },
  
  deleteBtn: {
    background: '#330000',
    border: '2px solid #660000',
    color: '#ff6b6b',
    width: '30px',
    height: '30px',
    fontFamily: "'VT323', monospace",
    fontSize: '1.2rem',
    cursor: 'pointer',
  },
  
  matchBtn: {
    width: '100%',
    padding: '20px',
    fontSize: '1.1rem',
    fontFamily: "'VT323', monospace",
    background: 'linear-gradient(180deg, #ffff00 0%, #ff9900 100%)',
    border: '4px solid #000',
    boxShadow: '6px 6px 0 #000',
    color: '#000',
    cursor: 'pointer',
  },
  
  yoListInfo: {
    textAlign: 'center',
    color: '#888',
    marginBottom: '1.5rem',
    fontSize: '1.1rem',
  },
  
  yoListSubtext: {
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '5px',
  },
  
  yoItem: {
    padding: '15px',
    borderBottom: '1px solid #222',
  },
  
  yoItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  
  yoName: {
    fontSize: '1.2rem',
    textTransform: 'capitalize',
  },
  
  yoBadge: {
    fontSize: '0.9rem',
    background: '#ff00ff',
    color: '#000',
    padding: '3px 8px',
  },
  
  yoBodies: {
    fontSize: '1rem',
    color: '#888',
    textTransform: 'capitalize',
  },
  
  chatListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '1px solid #222',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  
  chatListName: {
    fontSize: '1.2rem',
    textTransform: 'capitalize',
  },
  
  chatListArrow: {
    color: '#ff00ff',
    fontSize: '1.5rem',
  },
  
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 100,
  },
  
  modal: {
    background: '#000',
    border: '4px solid #00ffff',
    padding: '2rem',
    width: '100%',
    maxWidth: '350px',
    textAlign: 'center',
  },
  
  modalHeader: {
    fontSize: '1.5rem',
    color: '#00ffff',
    marginBottom: '1.5rem',
  },
  
  modalInput: {
    width: '100%',
    padding: '12px',
    fontSize: '1.1rem',
    fontFamily: "'VT323', monospace",
    background: '#1a1a2e',
    border: '3px solid #333',
    color: '#fff',
    marginBottom: '1rem',
    boxSizing: 'border-box',
  },
  
  modalBtn: {
    width: '100%',
    padding: '15px',
    fontSize: '1.2rem',
    fontFamily: "'VT323', monospace",
    background: '#00ffff',
    border: 'none',
    color: '#000',
    cursor: 'pointer',
    marginBottom: '1rem',
  },
  
  modalClose: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontFamily: "'VT323', monospace",
    fontSize: '1rem',
    cursor: 'pointer',
  },
  
  matchModal: {
    background: '#000',
    border: '4px solid #ffff00',
    padding: '2rem',
    width: '100%',
    maxWidth: '450px',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  
  matchHeader: {
    fontSize: '1.8rem',
    color: '#ffff00',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  
  noMatch: {
    textAlign: 'center',
    padding: '2rem 1rem',
  },
  
  noMatchEmoji: {
    fontSize: '3rem',
    marginBottom: '1rem',
    color: '#666',
  },
  
  noMatchText: {
    fontSize: '1.4rem',
    color: '#888',
  },
  
  matchContent: {
    marginBottom: '1rem',
  },
  
  matchText: {
    fontSize: '1.2rem',
    color: '#00ffff',
    textAlign: 'center',
    marginBottom: '1.5rem',
    textTransform: 'capitalize',
  },
  
  matchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  
  matchItem: {
    background: '#1a1a2e',
    border: '2px solid #ff00ff',
    padding: '15px',
  },
  
  matchUserInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  
  matchName: {
    fontSize: '1.3rem',
    textTransform: 'capitalize',
  },
  
  matchBadge: {
    fontSize: '0.9rem',
    background: '#ff00ff',
    color: '#000',
    padding: '3px 8px',
  },
  
  matchBodies: {
    fontSize: '1rem',
    color: '#888',
    textTransform: 'capitalize',
    marginBottom: '1rem',
  },
  
  chatBtn: {
    width: '100%',
    padding: '10px',
    fontSize: '1rem',
    fontFamily: "'VT323', monospace",
    background: '#00ffff',
    border: 'none',
    color: '#000',
    cursor: 'pointer',
  },
  
  chatContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a1a',
  },
  
  chatHeader: {
    padding: '15px 20px',
    background: '#000',
    borderBottom: '4px solid #ff00ff',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  
  chatTitle: {
    color: '#ff00ff',
    fontSize: '1.3rem',
  },
  
  chatMessages: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  
  chatLoading: {
    textAlign: 'center',
    color: '#666',
    padding: '2rem',
  },
  
  chatEmpty: {
    textAlign: 'center',
    color: '#666',
    padding: '2rem',
    fontSize: '1.2rem',
  },
  
  message: {
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '4px',
  },
  
  messageSent: {
    alignSelf: 'flex-end',
    background: '#ff00ff33',
    border: '2px solid #ff00ff',
  },
  
  messageReceived: {
    alignSelf: 'flex-start',
    background: '#00ffff22',
    border: '2px solid #00ffff',
  },
  
  messageSender: {
    fontSize: '0.9rem',
    color: '#888',
    marginBottom: '4px',
  },
  
  messageText: {
    fontSize: '1.1rem',
    wordBreak: 'break-word',
  },
  
  chatInput: {
    display: 'flex',
    gap: '10px',
    padding: '15px',
    background: '#000',
    borderTop: '2px solid #333',
  },
  
  chatInputField: {
    flex: 1,
    padding: '12px',
    fontSize: '1.1rem',
    fontFamily: "'VT323', monospace",
    background: '#1a1a2e',
    border: '3px solid #333',
    color: '#fff',
    outline: 'none',
  },
  
  chatSendBtn: {
    padding: '12px 25px',
    fontSize: '1.1rem',
    fontFamily: "'VT323', monospace",
    background: '#ff00ff',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
  },
};
