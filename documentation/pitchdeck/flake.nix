{
  description = "NEMESIS Pitch Deck";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        pitch-deck = pkgs.stdenv.mkDerivation {
          pname = "nemesis-pitch";
          version = "1.0.0";
          src = ./.;
          
          installPhase = ''
            mkdir -p $out/share/nemesis-pitch
            cp index.html $out/share/nemesis-pitch/
          '';
        };
        
        serve-script = pkgs.writeShellScriptBin "nemesis-pitch" ''
          echo "NEMESIS Pitch Deck"
          echo "=================="
          echo ""
          echo "Serving at http://localhost:8080"
          echo "Press Ctrl+C to stop"
          echo ""
          ${pkgs.miniserve}/bin/miniserve --index index.html -p 8080 ${pitch-deck}/share/nemesis-pitch
        '';
        
      in {
        packages = {
          default = pitch-deck;
          serve = serve-script;
        };
        
        apps = {
          default = {
            type = "app";
            program = "${serve-script}/bin/nemesis-pitch";
          };
        };
        
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            miniserve
          ];
          
          shellHook = ''
            echo "NEMESIS Pitch Deck Dev Shell"
            echo "Run: miniserve --index index.html -p 8080 ."
          '';
        };
      }
    );
}
