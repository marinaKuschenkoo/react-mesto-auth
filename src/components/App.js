/*import logo from './logo.svg';*/
import { useEffect, useState, useContext } from "react";
import {
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "../App.css";
import Header from "./Header.js";
import Main from "./Main.js";
import Footer from "./Footer.js";
import EditProfilePopup from "./EditProfilePopup.js";
import PopupWithForm from "./PopupWithForm.js";
import EditAvatarPopup from "./EditAvatarPopup.js";
import AddPlacePopup from "./AddPlacePopup.js";
import ImagePopup from "./ImagePopup.js";
import Card from "./Card.js";
import avatar from "../images/Avatar.png";
import api from "../utils/Api.js";
import Login from "../components/Login.js";
import Register from "../components/Register.js";
import InfoTooltip from "../components/InfoTooltip.js";
import { CurrentUserContext } from "../contexts/CurrentUserContext.js";
import ProtectedRoute from "./ProtectedRoute";
import auth from "../utils/Auth.js";

function App() {
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    name: "Имя пользователя",
    about: "О пользователе",
    avatar: avatar,
  });
  const [isSucceeded, setIsSucceeded] = useState(false);
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    if (isLoggedIn) {
      Promise.all([api.getUserInfo(), api.getInitialCards()])
        .then(([userData, cardsData]) => {
          setCurrentUser(userData);
          setCards(cardsData);
        })
        .catch((err) => console.log(err));
    }
  }, [isLoggedIn]);

  function closeAllPopups() {
    setIsEditProfilePopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setIsInfoTooltipOpen(false);
    setSelectedCard(null);
  }

  const handleEditProfileClick = () => {
    setIsEditProfilePopupOpen(true);
  };
  const handleAddPlaceClick = () => {
    setIsAddPlacePopupOpen(true);
  };
  const handleEditAvatarClick = () => {
    setIsEditAvatarPopupOpen(true);
  };
  const handleCardClick = (card) => {
    setSelectedCard(card);
  };
  const handleDeleteCardClick = (card) => {
    setIsLoading(true);
    api
      .deleteCard(card._id)
      .then(() => {
        const newCards = cards.filter((item) =>
          item._id === card._id ? null : item
        );
        setCards(newCards);
      })
      .catch((err) => console.log(`Error: ${err}`))
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleCardLike = (card) => {
    const isLiked = card.likes.some((i) => i._id === currentUser._id);
    api
      .changeLikeStatus(card._id, !isLiked)
      .then((newCard) => {
        setCards((state) =>
          state.map((c) => (c._id === card._id ? newCard : c))
        );
      })
      .catch((err) => console.log(`Error: ${err}`));
  };

  const handleUpdateUser = (data) => {
    setIsLoading(true);
    api
      .changeUserInfo(data)
      .then((res) => {
        setCurrentUser(res);
        closeAllPopups();
      })
      .catch((err) => console.log(`Error: ${err}`))
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleUpdateAvatar = (data) => {
    setIsLoading(true);
    api
      .editAvatar(data)
      .then((res) => {
        setCurrentUser(res);
        closeAllPopups();
      })
      .catch((err) => console.log(`Error: ${err}`))
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleAddPlaceSubmit = (card) => {
    setIsLoading(true);
    api
      .createNewCard(card)
      .then((newCard) => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setIsLoading(false);
      });
  };
  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      auth
        .checkToken(jwt)
        .then((res) => {
          setUserEmail(res.data.email);
          setIsLoggedIn(true);
          navigate("/");
        })
        .catch((err) => console.log(err));
    }
  }, [navigate]);
  function handleRegister(email, password) {
    auth
      .register(email, password)
      .then((res) => {
        setIsInfoTooltipOpen(true);
        setIsSucceeded(true);
        navigate("/sign-in", { replace: true });
      })
      .catch((err) => {
        setIsInfoTooltipOpen(true);
        setIsSucceeded(false);
        console.log(`Ошибка: ${err}`);
      });
  }
  function handleLogin(email, password) {
    auth
      .login(email, password)
      .then((res) => {
        if (res) {
          setIsLoggedIn(true);
          navigate("/", { replace: true });
          localStorage.setItem("jwt", res.token);
        }
      })
      .catch((err) => {
        setIsInfoTooltipOpen(true);
        setIsSucceeded(false);
        console.log(`Ошибка: ${err}`);
      });
  }
  function handleLogout() {
    localStorage.removeItem("jwt");
    setIsLoggedIn(false);
  }

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="App">
        <div className="page">
          <Header onLogOut={handleLogout} email={userEmail} />
          <Routes>
            <Route
              path="/sign-up"
              element={<Register onRegister={handleRegister} />}
            />
            <Route path="/sign-in" element={<Login onLogin={handleLogin} />} />
            <Route
              path="/"
              element={
                <ProtectedRoute
                  isLoggedIn={isLoggedIn}
                  element={Main}
                  cards={cards}
                  onEditProfile={handleEditProfileClick}
                  onAddPlace={handleAddPlaceClick}
                  onEditAvatar={handleEditAvatarClick}
                  onCardClick={handleCardClick}
                  onCardDelete={handleDeleteCardClick}
                  onCardLike={handleCardLike}
                />
              }
            />
          </Routes>
          {isLoggedIn ? <Footer /> : ""}
          <EditProfilePopup
            isOpen={isEditProfilePopupOpen}
            onClose={closeAllPopups}
            onUpdateUser={handleUpdateUser}
            onLoading={isLoading}
          />
          <EditAvatarPopup
            isOpen={isEditAvatarPopupOpen}
            onClose={closeAllPopups}
            onUpdateAvatar={handleUpdateAvatar}
            onLoading={isLoading}
          />
          <AddPlacePopup
            isOpen={isAddPlacePopupOpen}
            onLoading={isLoading}
            onAddPlace={handleAddPlaceSubmit}
            onClose={closeAllPopups}
          />
          <ImagePopup card={selectedCard} onClose={closeAllPopups} />
          <InfoTooltip
            name={"info"}
            isSucceeded={isSucceeded}
            isOpen={isInfoTooltipOpen}
            onClose={closeAllPopups}
          />
        </div>
      </div>
    </CurrentUserContext.Provider>
  );
}

export default App;
