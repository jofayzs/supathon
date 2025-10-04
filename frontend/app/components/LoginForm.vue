<template>
  <div class="w-full max-w-md mx-auto">
    <!-- Logo/Brand Section -->
    <div class="text-center mb-8">
      <div
        class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
            clip-rule="evenodd"></path>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {{ isSignUp ? 'Create Account' : 'Welcome Back' }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ isSignUp ? 'Join us to get started with your journey' : 'Please sign in to your account' }}
      </p>
    </div>

    <!-- Main Card -->
    <UCard class="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <!-- Alert Messages -->
      <UAlert v-if="error" color="red" variant="soft" :title="error" class="mb-6"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link' }" @close="error = ''" />

      <UAlert v-if="success" color="green" variant="soft" :title="success" class="mb-6"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link' }" @close="success = ''" />

      <!-- Google Sign In Button -->
      <UButton @click="handleGoogleLogin" :loading="googleLoading" :disabled="googleLoading || loading"
        class="w-full mb-6" size="lg" color="white" variant="solid">
        <template v-if="googleLoading">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          Connecting to Google...
        </template>
        <template v-else>
          <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </template>
      </UButton>

      <!-- Divider -->
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-white text-gray-500">or continue with email</span>
        </div>
      </div>

      <!-- Email/Password Form (Collapsible) -->
      <div v-if="showEmailForm" class="space-y-6">
        <form @submit.prevent="handleEmailLogin" class="space-y-6">
          <UFormGroup label="Email Address" name="email" class="space-y-2">
            <UInput v-model="state.email" type="email" placeholder="Enter your email address" size="lg"
              :disabled="loading" icon="i-heroicons-envelope" class="transition-all duration-200" />
          </UFormGroup>

          <UFormGroup label="Password" name="password" class="space-y-2">
            <UInput v-model="state.password" type="password" placeholder="Enter your password" size="lg"
              :disabled="loading" icon="i-heroicons-lock-closed" class="transition-all duration-200" />
            <p v-if="isSignUp" class="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters long
            </p>
          </UFormGroup>

          <!-- Submit Button -->
          <UButton type="submit" :loading="loading" :disabled="loading || !state.email || !state.password"
            class="w-full" size="lg" :color="isSignUp ? 'green' : 'primary'" variant="solid">
            <template v-if="loading">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              {{ isSignUp ? 'Creating Account...' : 'Signing In...' }}
            </template>
            <template v-else>
              {{ isSignUp ? 'Create Account' : 'Sign In' }}
            </template>
          </UButton>
        </form>

        <!-- Toggle Sign Up/Sign In for Email -->
        <div class="text-center">
          <p class="text-sm text-gray-600 mb-3">
            {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
          </p>
          <UButton variant="link" color="primary" @click="isSignUp = !isSignUp" :disabled="loading" class="text-sm">
            {{ isSignUp ? 'Sign In Instead' : 'Create New Account' }}
          </UButton>
        </div>
      </div>

      <!-- Toggle Email Form Visibility -->
      <div v-else class="text-center">
        <UButton variant="outline" color="gray" @click="showEmailForm = true" :disabled="loading || googleLoading"
          class="w-full transition-all duration-200 hover:bg-gray-50">
          Use Email Instead
        </UButton>
      </div>

    </UCard>

    <!-- Footer -->
    <div class="text-center mt-6">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        By continuing, you agree to our
        <a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a>
        and
        <a href="#" class="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { supabase } from '../../utils/supabase'

const isSignUp = ref(false)
const loading = ref(false)
const googleLoading = ref(false)
const error = ref('')
const success = ref('')
const showEmailForm = ref(false)

const state = reactive({
  email: '',
  password: ''
})

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateForm = () => {
  if (!state.email || !validateEmail(state.email)) {
    throw new Error('Please enter a valid email address')
  }
  if (!state.password || state.password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }
}

const emit = defineEmits(['success'])

const handleGoogleLogin = async () => {
  googleLoading.value = true
  error.value = ''
  success.value = ''

  try {
    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`
      }
    })

    if (authError) throw authError

    // The redirect will happen automatically, so we don't need to emit success here
    // The auth state change will be handled by the auth listener
  } catch (err) {
    error.value = err.message
    googleLoading.value = false
  }
}

const handleEmailLogin = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    validateForm()

    let result

    if (isSignUp.value) {
      result = await supabase.auth.signUp({
        email: state.email,
        password: state.password
      })

      if (result.error) throw result.error

      success.value = 'Check your email for confirmation link'
    } else {
      result = await supabase.auth.signInWithPassword({
        email: state.email,
        password: state.password
      })

      if (result.error) throw result.error

      success.value = 'Successfully signed in!'
      emit('success', result.data.user)
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Watch for auth state changes (for OAuth redirects)
onMounted(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      emit('success', session.user)
    }
  })

  // Cleanup subscription on unmount
  onUnmounted(() => {
    subscription.unsubscribe()
  })
})

watch(isSignUp, () => {
  error.value = ''
  success.value = ''
})

watch(showEmailForm, () => {
  error.value = ''
  success.value = ''
})
</script>