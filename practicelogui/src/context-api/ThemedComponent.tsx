import axios, { AxiosError, AxiosResponse } from 'axios'
import React, { createContext, useContext, useEffect, useMemo, useState, useReducer } from 'react'
import { Button, List, ListItem, ListItemButton, Paper } from '@mui/material';

type Style = {
  background: string
}

interface IThemeContext {
  style: Style,
  setStyle: (Style: Style) => void
}

export const ThemeContext = createContext<IThemeContext>({
  style: {
    "background": "black"
  },
  setStyle: () => {}
})

/*
  Basic Hooks
  - useState
  - useContext
  - useEffect

  Additional Hooks
  - useReducer (similar to useState, but I can derive a new state from recieved data)
*/

type Todo = {
  userId: number
  id: number
  title: string
  completed: boolean
}

type TodoState = {
  todos: Todo[]
  selectedTodoID?: number
  error?: string
}

type TodoAction = {
  type: string
  newTodos: Todo[]
  selectedID?: number
  error?: string
}

function TodoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'FETCH':
      return {
        ...state,
        todos: action.newTodos,
        error: undefined
      }
    case 'SELECT':
      return {
        ...state,
        selectedTodoID: action.selectedID
      }
    case 'ERROR':
      return {
        ...state,
        error: action.error
      }
    default:
      return state
  }
}

async function fetchTodo(): Promise<TodoAction> {
  try {
    const resp: AxiosResponse = await axios.get('https://jsonplaceholder.typicode.com/todos')
    const todos: Todo[] = resp.data
    return { type: 'FETCH', newTodos: todos }
  } catch (err: unknown) {
    const error = err as AxiosError
    return { type: 'ERROR', newTodos: [], error: error.message}
  }
}

export function ThemedComponent() {
  const [style, setStyle] = useState<Style>({"background": "black"})
  const [todoState, dispatch] = useReducer(TodoReducer, { todos: [] })

  /* Pass a “create” function and an array of dependencies. useMemo will only recompute the
  memoized value when one of the dependencies has changed. This optimization helps to avoid
  expensive calculations on every render.

  In most cases, I don't need this.
  */
  const defaultTheme = useMemo(() => ({style , setStyle}), [style])

  // This is equivalent to componentDidUpdate()
  useEffect(() => {
    console.log('fetch todos now')
    fetchTodo().then((action: TodoAction) => dispatch(action))
   }, [style])

  const listItems: JSX.Element[] = todoState.todos.map((todo: Todo) => {
    if (todoState.selectedTodoID !== null && todoState.selectedTodoID === todo.id) {
      return (
        <ListItem key={todo.id}>
          <ListItemButton>
            <b>{todo.title}</b>
          </ListItemButton>
        </ListItem>
      )
    }
    return (
      <ListItem key={todo.id}>
        <ListItemButton onClick={() => dispatch({ type: 'SELECT', newTodos: [], selectedID: todo.id})}>
          {todo.title}
        </ListItemButton>
      </ListItem>
    )
  })

  // This is equivalent to componentDidMount()
  useEffect(() => console.log('mounted'), []);

  let errorWidget: JSX.Element | null = null
  if (todoState.error) {
    errorWidget = <div>Failed to fetch todos with reason: <b>{todoState.error}</b></div>
  }

  return (
    <ThemeContext.Provider value={defaultTheme}>
      <GrandParentComponent />
      <Paper style={{"margin": "1rem"}}>
        <List>
          {listItems}
        </List>
      </Paper>
      {errorWidget}
    </ThemeContext.Provider>
  )
}

function GrandParentComponent() {
  return (
    <div>
      <h1>Grand Parent</h1>
      <ParentComponent />
    </div>
  )
}

function ParentComponent() {
  return (
    <div>
      <h2>Parent</h2>
      <SonComponent />
      <DaughterComponent />
    </div>
  )
}

function SonComponent() {
  const {style, setStyle} = useContext(ThemeContext);
  return (
    <div style={style}>
      <h3>Son</h3>
      <Button variant='contained' onClick={() => setStyle({ "background": "green"})}>
        Set Background Green
      </Button>
    </div>
  )
}

function DaughterComponent() {
  const {style, setStyle} = useContext(ThemeContext);
  return (
    <div style={style}>
      <h3>Daughter</h3>
      <Button variant='contained' onClick={() => setStyle({ "background": "red"})}>
        Set Background Red
      </Button>
    </div>
  )
}
