import version from "../../package.json";
import { Github, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full border-t border-gray-800 bg-gradient-to-b from-gray-900/50 to-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400/30">
        <div className="flex items-center gap-2">
          <span className="bg-gray-800 text-secondary px-2 py-1 rounded-md text-xs font-mono">
            v{version.version}
          </span>
        </div>

        <div className="text-center text-primary">
          © 2025 Bharat Rana. All rights reserved.
        </div>

        <div className="flex items-center gap-2 text-primary">
          <span>Created with</span>
          <Heart className="h-4 w-4 text-destructive fill-red-500/20" />
          <span>by Bharat</span>
          <a
            href="https://github.com/MrPrince998"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-purple-400 transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
