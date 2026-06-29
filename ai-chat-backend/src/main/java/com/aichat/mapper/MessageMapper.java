package com.aichat.mapper;

import com.aichat.entity.Message;
import java.time.LocalDateTime;
import java.util.List;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface MessageMapper extends BaseMapper<Message> {
    @Select("SELECT * FROM message WHERE conversation_id = #{conversationId} AND role = 'user' AND id < #{messageId} ORDER BY id DESC LIMIT 1")
    Message getPreviousUserMessage(@Param("conversationId") Long conversationId, @Param("messageId") Long messageId);

    @Select("SELECT id, conversation_id, role, content, thinking, file_ids, created_at FROM message " +
            "WHERE conversation_id = #{conversationId} AND created_at < #{before} " +
            "ORDER BY created_at DESC LIMIT #{limit}")
    List<Message> selectRecentContextMessages(@Param("conversationId") Long conversationId,
                                              @Param("before") LocalDateTime before,
                                              @Param("limit") Integer limit);
}
