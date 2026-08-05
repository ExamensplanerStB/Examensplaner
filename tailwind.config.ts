import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)'
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'var(--destructive)',
  				foreground: 'var(--destructive-foreground)'
  			},
  			border: 'var(--border)',
  			input: 'var(--input)',
  			ring: 'var(--ring)',
  			ink: {
  				1: 'var(--ink-1)',
  				2: 'var(--ink-2)',
  				3: 'var(--ink-3)'
  			},
  			ampel: {
  				green: 'var(--ampel-green)',
  				amber: 'var(--ampel-amber)',
  				red: 'var(--ampel-red)',
  				grey: 'var(--ampel-grey)'
  			},
  			hub: {
  				theorie: 'var(--hub-theorie)',
  				klausurtechnik: 'var(--hub-klausurtechnik)',
  				uebung: 'var(--hub-uebung)',
  				probeklausur: 'var(--hub-probeklausur)'
  			},
  			cal: {
  				vorlesung: 'var(--cal-vorlesung)',
  				lernen: 'var(--cal-lernen)',
  				wiederholung: 'var(--cal-wiederholung)',
  				frist: 'var(--cal-frist)'
  			},
  			sidebar: {
  				DEFAULT: 'var(--sidebar-background)',
  				foreground: 'var(--sidebar-foreground)',
  				primary: 'var(--sidebar-primary)',
  				'primary-foreground': 'var(--sidebar-primary-foreground)',
  				accent: 'var(--sidebar-accent)',
  				'accent-foreground': 'var(--sidebar-accent-foreground)',
  				border: 'var(--sidebar-border)',
  				ring: 'var(--sidebar-ring)'
  			}
  		},
  		fontFamily: {
  			sans: ['var(--font-dm-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  			'serif-display': ['var(--font-dm-serif-display)', 'Georgia', 'Times New Roman', 'serif']
  		},
  		boxShadow: {
  			card: 'var(--shadow-card)',
  			pop: 'var(--shadow-pop)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
};
export default config;
