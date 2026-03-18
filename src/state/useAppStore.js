import { useMemo, useReducer } from 'react';
import { initialState } from './initialState';

function reducer(state, action) {
  switch (action.type) {
    case 'setView':
      return { ...state, view: action.payload };
    case 'setSearchQuery':
      return { ...state, searchQuery: action.payload };
    case 'toggleTheme':
      return { ...state, themeMode: state.themeMode === 'light' ? 'dark' : 'light' };
    case 'setFolder':
      return { ...state, selectedFolder: action.payload };
    case 'setStage':
      return { ...state, selectedStage: action.payload, view: 'pipeline' };
    case 'selectEmail': {
      const email = state.emails.find((item) => item.id === action.payload) ?? null;
      return {
        ...state,
        selectedEmailId: action.payload,
        selectedDealId: email?.dealId ?? null,
        view: 'email'
      };
    }
    case 'selectDeal':
      return { ...state, selectedDealId: action.payload, view: 'pipeline' };
    case 'setPopupOpen':
      return {
        ...state,
        popups: {
          ...state.popups,
          [action.payload.name]: action.payload.open
        }
      };
    case 'setLoading':
      return { ...state, showLoading: action.payload };
    case 'showToast':
      return { ...state, toast: { visible: true, message: action.payload } };
    case 'hideToast':
      return { ...state, toast: { ...state.toast, visible: false } };
    default:
      return state;
  }
}

export function useAppStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(
    () => ({
      setView: (view) => dispatch({ type: 'setView', payload: view }),
      setSearchQuery: (query) => dispatch({ type: 'setSearchQuery', payload: query }),
      toggleTheme: () => dispatch({ type: 'toggleTheme' }),
      setSelectedFolder: (folder) => dispatch({ type: 'setFolder', payload: folder }),
      setSelectedStage: (stage) => dispatch({ type: 'setStage', payload: stage }),
      selectEmail: (emailId) => dispatch({ type: 'selectEmail', payload: emailId }),
      selectDeal: (dealId) => dispatch({ type: 'selectDeal', payload: dealId }),
      setPopupOpen: (name, open) => dispatch({ type: 'setPopupOpen', payload: { name, open } }),
      setLoading: (loading) => dispatch({ type: 'setLoading', payload: loading }),
      showToast: (message) => dispatch({ type: 'showToast', payload: message }),
      hideToast: () => dispatch({ type: 'hideToast' })
    }),
    []
  );

  return { state, actions };
}
