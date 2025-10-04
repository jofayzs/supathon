<template>
  <div class="w-full max-w-md mx-auto">
    <!-- Logo/Brand Section -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">
        {{ isSignUp ? 'Create Account' : 'Welcome Back' }}
      </h1>
      <p class="text-gray-600">
        {{ isSignUp ? 'Join us to get started with your journey' : 'Please sign in to your account' }}
      </p>
    </div>

    <!-- Main Card -->
    <UCard class="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <!-- Alert Messages -->
      <UAlert
        v-if="error"
        color="red"
        variant="soft"
        :title="error"
        class="mb-6"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link' }"
        @close="error = ''"
      />

      <UAlert
        v-if="success"
        color="green"
        variant="soft"
        :title="success"
        class="mb-6"
        :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link' }"
        @close="success = ''"
      />

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <UFormGroup label="Email Address" name="email" class="space-y-2">
          <UInput 
            v-model="state.email" 
            type="email" 
            placeholder="Enter your email address"
            size="lg"
            :disabled="loading"
            icon="i-heroicons-envelope"
            class="transition-all duration-200"
          />
        </UFormGroup>

        <UFormGroup label="Password" name="password" class="space-y-2">
          <UInput 
            v-model="state.password" 
            type="password" 
            placeholder="Enter your password"
            size="lg"
            :disabled="loading"
            icon="i-heroicons-lock-closed"
            class="transition-all duration-200"
          />
          <p v-if="isSignUp" class="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters long
          </p>
        </UFormGroup>

        <!-- Submit Button -->
        <UButton
          type="submit"
          :loading="loading"
          :disabled="loading || !state.email || !state.password"
          class="w-full"
          size="lg"
          :color="isSignUp ? 'green' : 'primary'"
          variant="solid"
        >
          <template v-if="loading">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isSignUp ? 'Creating Account...' : 'Signing In...' }}
          </template>
          <template v-else>
            {{ isSignUp ? 'Create Account' : 'Sign In' }}
          </template>
        </UButton>
      </form>

      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-white text-gray-500">or</span>
        </div>
      </div>

      <!-- Toggle Sign Up/Sign In -->
      <div class="text-center">
        <p class="text-sm text-gray-600 mb-3">
          {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
        </p>
        <UButton 
          variant="outline" 
          color="gray"
          @click="isSignUp = !isSignUp" 
          :disabled="loading"
          class="w-full transition-all duration-200 hover:bg-gray-50"
        >
          {{ isSignUp ? 'Sign In Instead' : 'Create New Account' }}
        </UButton>
      </div>
    </UCard>

    <!-- Footer -->
    <div class="text-center mt-6">
      <p class="text-xs text-gray-500">
        By continuing, you agree to our 
        <a href="#" class="text-blue-600 hover:underline">Terms of Service</a> 
        and 
        <a href="#" class="text-blue-600 hover:underline">Privacy Policy</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { supabase } from '../../utils/supabase'

const isSignUp = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')

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

const handleLogin = async () => {
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

watch(isSignUp, () => {
  error.value = ''
  success.value = ''
})
</script>