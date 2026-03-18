import { useMemo, useReducer } from 'react';
import { initialState } from './initialState';

function reducer(state, action) {
  switch (action.type) {
    case 'setActiveView':
      return { ...state, activeView: action.payload };
    case 'selectEmail':
      return { ...state, selectedEmailId: action.payload };
    case 'togglePopup':
      return {
        ...state,
        popups: {
          ...state.popups,
          [action.payload.name]: action.payload.open
        }
      };
    default:
      return state;
  }
}

/**
 * Lightweight app store hook for orchestrating page state.
 */
export function useAppStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(
    () => ({
      setActiveView: (view) => dispatch({ type: 'setActiveView', payload: view }),
      selectEmail: (emailId) => dispatch({ type: 'selectEmail', payload: emailId }),
      setPopupOpen: (name, open) => dispatch({ type: 'togglePopup', payload: { name, open } })
    }),
    []
  );

  return { state, actions };
}
