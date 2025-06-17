{ pkgs, lib, config, inputs, ... }:

{
  packages = [ 
    pkgs.git
    pkgs.jq
    pkgs.yq-go
    pkgs.pre-commit
    pkgs.awscli
    pkgs.gnumake
  ];

  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_20;
  };
  languages.typescript.enable = true;
  languages.javascript.yarn.enable = true;
}
