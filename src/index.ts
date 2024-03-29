import {
    store,
    computed,
    next,
    unknown,
    Transaction
  } from 'spellcaster/spellcaster.js'
  
  import {
    tags,
    repeat,
    text,
    cid,
    indexById,
    Identifiable
  } from 'spellcaster/hyperscript.js'
  
  const {div, button, input} = tags
  
  // Messages
  
  type Msg = UpdateInputMsg | SubmitInputMsg | CompleteMsg
  
  type UpdateInputMsg = {
    type: 'updateInput'
    value: string
  }
  
  const updateInputMsg = (value: string): UpdateInputMsg => ({
    type: 'updateInput',
    value
  })
  
  type SubmitInputMsg = {
    type: 'submitInput'
    value: string
  }
  
  const submitInputMsg = (value: string): SubmitInputMsg => ({
    type: 'submitInput',
    value
  })
  
  type CompleteMsg = {
    type: 'complete'
    id: string
    isComplete: boolean
  }
  
  const completeMsg = (id: string, isComplete: boolean): CompleteMsg => ({
    type: 'complete',
    id,
    isComplete
  })
  
  // Models and views
  
  interface TodoModel extends Identifiable {
    id: string
    isComplete: boolean
    text: string
  }
  
  const TodoModel = ({
    id=cid(),
    isComplete=false,
    text=''
  }): TodoModel => ({
    id,
    isComplete,
    text
  })
  
  const Todo = (
    todo: () => TodoModel,
    send: (msg: Msg) => void
  ) => div(
    {className: 'todo'},
    [
      div(
        {className: 'todo-text'},
        text(() => todo().text)
      ),
      button(
        {
          className: 'button-done',
          onclick: () => send(completeMsg(todo().id, true))
        },
        text('Done')
      )
    ]
  )
  
  type InputModel = {
    text: string
  }
  
  const InputModel = ({text=''}): InputModel => ({text})
  
  const TodoInput = (
    state: () => InputModel,
    send: (msg: Msg) => void
  ) => input(
    () => ({
      value: state().text,
      placeholder: 'Enter todo...',
      oninput: (event : Event) => {
        const value = (event.target as HTMLInputElement).value
        send(updateInputMsg(value))
      },
      onkeyup: (event : KeyboardEvent) => {
        if (event.key === 'Enter') {
            const value = (event.target as HTMLInputElement).value
          send(submitInputMsg(value))
        }
      },
      type: 'text',
      className: 'todo-input'
    })
  )
  
  type AppModel = {
    input: InputModel
    todos: Map<string, TodoModel>
  }
  
  const AppModel = ({
    input=InputModel({}),
    todos=new Map<string, TodoModel>()
  }): AppModel => ({
    input,
    todos
  })
  
  const App = (
    state: () => AppModel,
    send: (msg: Msg) => void
  ): HTMLElement => div(
    {className: 'app'},
    [
      TodoInput(
        computed(() => state().input),
        send
      ),
      div(
        {className: 'todos'},
        repeat(Todo, computed(() => state().todos), send)
      )
    ]
  )
  
  const init = (): Transaction<AppModel, Msg> => next(
    AppModel({})
  )
  
  const update = (
    state: AppModel,
    msg: Msg
  ): Transaction<AppModel, Msg> => {
    switch (msg.type) {
    case 'updateInput':
      return updateInput(state, msg.value)
    case 'submitInput':
      return submitInput(state, msg.value)
    case 'complete':
      return complete(state, msg.id)
    default:
      return unknown(state, msg)
    }
  }
  
  const updateInput = (
    state: AppModel,
    text: string
  ): Transaction<AppModel, Msg> => next({
    ...state,
    input: InputModel({text})
  })
  
  const submitInput = (
    state: AppModel,
    text: string
  ): Transaction<AppModel, Msg> => next(
    AppModel({
      ...state,
      input: InputModel({text: ''}),
      todos: indexById<string, TodoModel>([
        ...state.todos.values(),
        TodoModel({text})
      ])
    })
  )
  
  const complete = (
    state: AppModel,
    id: string
  ): Transaction<AppModel, Msg> => {
    if (!state.todos.has(id)) {
      console.log("No item for ID. Doing nothing.", id)
      return next(state)
    }
    const todos = new Map(state.todos)
    todos.delete(id)
    return next({
      ...state,
      todos
    })
  }
  
  const [state, send] = store({
    init,
    update,
    debug: true
  })
  
  const appEl = App(state, send)
  document.body.append(appEl)