import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { ThemeProvider } from '#/lib/theme-context'
import { AuthProvider } from '#/lib/auth-context'
import { MuiAppProvider } from '#/lib/mui-provider'
import { AppNavbar } from '#/components/layout/AppNavbar'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'ApexFinance | Enterprise Financial Engine',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-[#070e11] text-[#d7ece8] font-sans antialiased selection:bg-[#4fb8b2]/30 selection:text-white transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <MuiAppProvider>
              <div className="flex flex-col min-h-screen">
                <AppNavbar />
                <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                  {children}
                </main>
                <footer className="border-t border-[#8de5db]/10 py-6 text-center text-xs text-[#afcdc8]/60">
                  <p>ApexFinance Enterprise &copy; 2026. Production Grade Financial Engine.</p>
                </footer>
              </div>
            </MuiAppProvider>
          </AuthProvider>
        </ThemeProvider>

        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
