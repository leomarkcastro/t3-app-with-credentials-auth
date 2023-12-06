import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { getCsrfToken, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SignIn({
  csrfToken,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    // get query params
    console.log("router.query", router.query);
    if (router.query.callbackUrl) {
      console.log(router.query.callbackUrl);
      // router.replace(router.query.callbackUrl as string);
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center font-mono">
      <div className="d-card bg-base-100 w-96 shadow-xl">
        <div className="d-card-body text-center font-bold">
          <h1 className="text-4xl font-bold">Login</h1>
          <br />
          <div className="">
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
            <div className="d-form-control w-full max-w-xs">
              <label className="d-label">
                <span className="d-label-text">Email</span>
              </label>
              <input
                name="username"
                type="text"
                placeholder="name@email.com"
                className="d-input-bordered d-input d-input-sm w-full max-w-xs"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="d-form-control w-full max-w-xs">
              <label className="d-label">
                <span className="d-label-text">Password</span>
              </label>
              <input
                name="password"
                type="password"
                className="d-input-bordered d-input d-input-sm w-full max-w-xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <br />
            <button
              className="d-btn-sm d-btn"
              onClick={async () => {
                const resp = await signIn("credentials", {
                  username,
                  password,
                  redirect: false,
                });
                if (resp?.error) {
                  alert(resp.error);
                } else {
                  // console.log("resp", resp);
                  await router.replace("/");
                }
              }}
            >
              Sign in
            </button>
            <br />
            <Link href="/auth/signup">Sign Up Instead</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  };
}
