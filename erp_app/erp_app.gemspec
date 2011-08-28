# Provide a simple gemspec so you can easily use your
# project in your rails apps through git.
Gem::Specification.new do |s|
  s.name = "erp_app"
  s.summary = "Insert ErpApp summary."
  s.description = "Insert ErpApp description."
  s.files = Dir["{app,config,db,lib}/**/*"] + ["MIT-LICENSE", "Rakefile", "README.rdoc"]
  s.test_files = Dir["test/**/*"]
  s.version = "0.0.1"
  s.add_development_dependency("rspec-rails", "~> 2.5")
end