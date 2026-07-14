import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  headerTitle: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, headerTitle }) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <style>
          {`
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              line-height: 1.6; 
              color: #12151a;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .email-header { 
              background: #f38607; 
              color: #ffffff; 
              padding: 30px 20px;
              text-align: center; 
            }
            .email-content { 
              padding: 30px; 
            }
            .email-footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #757575; 
              font-size: 14px;
              padding: 20px;
              border-top: 1px solid #eeeeee;
            }
            .email-button { 
              background: #f38607; 
              color: #ffffff; 
              padding: 14px 28px;
              text-decoration: none; 
              border-radius: 6px; 
              display: inline-block;
              font-weight: 600;
              margin: 20px 0;
              border: none;
              cursor: pointer;
            }
            .email-code { 
              font-family: 'Courier New', monospace;
              background: #f5f5f5;
              padding: 12px;
              border-radius: 6px;
              margin: 15px 0;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
              color: #f38607;
              border: 1px solid #e0e0e0;
            }
            .email-warning { 
              background: #ffb74d; 
              border-left: 4px solid #b87c28; 
              padding: 16px;
              margin: 20px 0;
              border-radius: 4px;
              color: #000000;
            }
            .email-divider {
              height: 1px;
              background: #e0e0e0;
              margin: 25px 0;
            }
            .link {
              color: #0288d1;
              text-decoration: none;
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="email-header">
            <h1>
              {headerTitle}
            </h1>
          </div>

          <div className="email-content">{children}</div>

          <div className="email-footer">
            <p>Equipe Orça · {new Date().getFullYear()}</p>
            <p>
              <a href={process.env.FRONTEND_POLICY_URL} className="link">
                Política de Privacidade
              </a>{" "}
              ·
              <a href={process.env.FRONTEND_TERMS_URL} className="link">
                Termos de Uso
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
