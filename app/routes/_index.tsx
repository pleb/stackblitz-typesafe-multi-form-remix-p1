import type { MetaFunction } from '@remix-run/node'
import { ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData, useSubmit } from '@remix-run/react'
import { db } from '~/utilities/database'
import { useCallback, useEffect, useState } from 'react'
import { randomDelayBetween } from '~/utilities/delay'
import { GlassButton } from '~/components/molecules/GlassButton'
import { Title } from '~/components/atoms/Title'
import { GlassPanel } from '~/components/molecules/GlassPanel'
import { Panel } from '~/components/atoms/Panel'
import Loading from '~/icons/LoadingIndicator'
import { cn } from '~/utilities/cn'
import { IconButton } from '~/components/molecules/IconButton'
import Delete from '~/icons/Delete'
import Edit from '~/icons/Edit'
import { Button } from '~/components/atoms/Button'
import { useFocus } from '~/hooks/useFocus'
import { useFormReset } from '~/hooks/useFormReset'
import { useLoadingContext } from '~/hooks/useLoadingContext'

export const meta: MetaFunction = () => {
  return [
    { title: 'Simple to-do tracking application' },
    {
      name: 'description',
      content:
        'Simple to-do application is a collection of to-do entries that can be completed, edited or deleted',
    },
  ]
}

export const loader = async () => {
  return db.load().filter(i => !i.completed && !i.deleted)
}

export const action = async ({ request }: ActionFunctionArgs) => {
  // Simulate network latency
  await randomDelayBetween(50, 350)

  const formData = await request.formData()
  const { _action, ...values } = Object.fromEntries(formData.entries())

  switch (_action) {
    case 'reset':
      {
        db.populateSample()
      }
      break
    case 'delete': {
      if (isNaN(Number(values.id)))
        return 'An error occurred because the delete action was not provided a valid ID.'

      db.patch(Number(values.id), { deleted: true })
      break
    }
    case 'complete': {
      if (isNaN(Number(values.id)))
        return 'An error occurred because the complete action was not provided a valid ID.'

      db.patch(Number(values.id), { completed: true })
      break
    }
    case 'upsert': {
      const isEdit = values.id !== '' && !isNaN(Number(values.id))
      if (typeof values.description !== 'string' || values.description === '')
        return `An error occurred because ${
          isEdit ? 'editing' : 'adding'
        } requires a description to be provided`

      if (isEdit) {
        db.patch(Number(values.id), { description: values.description })
      } else {
        db.append({ description: values.description })
      }
      break
    }
    default:
      return `An error occurred because no handler has been added to process ${_action}`
  }
  return null
}

type Todo = Awaited<ReturnType<typeof loader>>[number]

export default function Index() {
  const todos = useLoaderData<typeof loader>()
  const actionResult = useActionData<typeof action>()

  const [editTodo, setEditTodo] = useState<Todo>()
  const [formRef, resetForm] = useFormReset()
  const [inputRef, setInputFocus] = useFocus<HTMLInputElement>()

  useEffect(() => {
    setInputFocus()
  }, [editTodo, setInputFocus])

  const clearEdit = useCallback(() => {
    setEditTodo(undefined)
    resetForm()
  }, [setEditTodo, resetForm])

  const loadingContext = useLoadingContext()
  const submit = useSubmit()

  return (
    <div
      className={
        'sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg mx-[auto]'
      }
    >
      {actionResult && (
        <div className={cn('absolute ml-1', 'bg-error px-3 py-1 text-white')}>
          {actionResult}
        </div>
      )}
      <Form method='post' className='grid mb-2'>
        <GlassButton
          type='submit'
          name='_action'
          value='reset'
          className='place-self-end py-1 px-4'
          onClick={clearEdit}
          disabled={loadingContext.isLoading}
        >
          Reset
        </GlassButton>
      </Form>
      <GlassPanel className='relative'>
        <Title aria-label='Simple to-do'>Simple Todo</Title>
        <Loading
          className='absolute right-2 top-5 animate-spin h-5 w-5 mr-3'
          hidden={!loadingContext.isLoading}
        />
        <Panel className='mt-2 px-4' aria-live='polite'>
          {todos.map(todo => (
            <Form replace method='post' key={todo.id}>
              <input type='hidden' name='id' value={todo.id.toString()} />
              <Panel
                border='b'
                className={cn('p-3', 'hover:bg-glass/20', 'grid grid-flow-col')}
              >
                <div
                  aria-label={`To-do entry ${todo.description}`}
                  aria-flowto={`delete-${todo.id}`}
                >
                  {todo.description}
                </div>
                {!editTodo && (
                  <div className='w-30 justify-self-end grid gap-2 grid-flow-col content-center'>
                    <IconButton
                      id={`delete-${todo.id}`}
                      color='Red'
                      type='submit'
                      name='_action'
                      value='delete'
                      disabled={loadingContext.isLoading}
                      aria-label='Delete to-do entry'
                    >
                      <Delete aria-hidden={true} />
                    </IconButton>
                    <IconButton
                      color='Green'
                      onClick={() => setEditTodo(todo)}
                      disabled={loadingContext.isLoading}
                      aria-label='Edit to-do entry'
                    >
                      <Edit aria-hidden={true} />
                    </IconButton>
                    <input
                      type='checkbox'
                      className='ml-2'
                      name='_action'
                      aria-label='Complete to-do entry'
                      value='complete'
                      onChange={e => {
                        submit(e.currentTarget.form)
                      }}
                      disabled={loadingContext.isLoading}
                    />
                  </div>
                )}
              </Panel>
            </Form>
          ))}
        </Panel>
        <Form
          replace
          ref={formRef}
          onSubmit={() => {
            setTimeout(clearEdit)
          }}
          method='post'
        >
          <input type='hidden' name='id' value={editTodo?.id.toString()} />
          <div className='mt-2 py-3 px-4 grid grid-flow-col auto-cols-[1fr_200px] gap-2 items-start'>
            <input
              type='text'
              ref={inputRef}
              className={cn('p-2 border', 'w-full', 'rounded-md', 'text-black')}
              aria-label='To-do description'
              placeholder='Todo description'
              name='description'
              defaultValue={editTodo?.description ?? ''}
              disabled={loadingContext.isLoading}
            />

            <Button
              className='text-black'
              type='submit'
              name='_action'
              value='upsert'
              disabled={loadingContext.isLoading}
            >
              {editTodo ? 'Edit' : 'Add'}
            </Button>
          </div>
        </Form>
      </GlassPanel>
    </div>
  )
}
