# If the path is, aside from a slash and an optional locale, the leftmost part
# of the path, replace it by "sections/:id" segments.

module RoutingFilter
  class SectionRouter < Filter

    def around_recognize(path, env, &block)
      website = Website.find_by_host(env[:host_with_port])
      paths = paths_for_website(website)
      if path !~ %r(^/([\w]{2,4}/)?admin) and !paths.empty? and path =~ recognize_pattern(paths)
        if section = website_section_by_path(website, $2)
          type = section.type.pluralize.downcase
          path.sub! %r(^/([\w]{2,4}/)?(#{paths})(?=/|\.|$)), "/#{$1}#{type}/#{section.id}#{$3}"
        end
      end
      yield
    end
    
    def around_generate(*args, &block)      
      returning yield do |result|
        result = result.first if result.is_a?(Array)
        if result !~ %r(^/([\w]{2,4}/)?admin) and result =~ generate_pattern
          section = WebsiteSection.find $2.to_i
          result.sub! "#{$1}/#{$2}", "#{section.path[1..section.path.length]}#{$3}"
        end
      end
    end
    
    protected
    def paths_for_website(website)
      website ? website.all_section_paths.map{|path| path[1..path.length]}.sort{|a, b| b.size <=> a.size }.join('|') : []
    end

    def website_section_by_path(website, path)
      path = "/#{path}"
      valid_section = website.website_sections.detect{|website_section| website_section.path == path }
      if valid_section.nil?
        website.website_sections.each do |website_section|
          valid_section = website_section.child_by_path(path)
          break unless valid_section.nil?
        end
      end

      valid_section
    end

    def recognize_pattern(paths)
        %r(^/([\w]{2,4}/)?(#{paths})(?=/|\.|$))
      end

    def generate_pattern
      types = WebsiteSection.types.map{|type| type.downcase.pluralize }.join('|')
      %r((#{types})/([\d]+(/?))(\.?)) # ?(?=\b)?
    end
  end
end
