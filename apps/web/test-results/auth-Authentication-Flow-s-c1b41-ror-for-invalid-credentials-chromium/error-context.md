# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - heading "Sign in to your account" [level=2] [ref=e5]
    - paragraph [ref=e6]:
      - text: Or
      - link "create a new account" [ref=e7] [cursor=pointer]:
        - /url: /auth/signup
  - generic [ref=e8]:
    - generic [ref=e9]:
      - textbox "Email address" [ref=e11]
      - textbox "Password" [ref=e13]
    - link "Forgot your password?" [ref=e15] [cursor=pointer]:
      - /url: /auth/forgot-password
    - button "Sign in" [ref=e17] [cursor=pointer]
  - generic [ref=e18]:
    - generic [ref=e23]: Or continue with
    - generic [ref=e24]:
      - button "Google Google" [ref=e26] [cursor=pointer]:
        - img "Google" [ref=e27]
        - text: Google
      - button "Microsoft Microsoft" [ref=e29] [cursor=pointer]:
        - img "Microsoft" [ref=e30]
        - text: Microsoft
```